'use strict'

//polyfills extend globals, only need to include it once here
require( './polyfills' )

const express = require( 'express' )
const session = require( 'express-session' )
const flash = require('connect-flash')
const cookieParser = require( 'cookie-parser' )
const bodyParser = require( 'body-parser' )
const passport = require( 'passport' )
const LocalStrategy = require('passport-local').Strategy
const compression = require( 'compression' )

const templates = require( './src/template-engine' )
const controllers = require( './controllers' )
const pluginApi = require( './src/api/plugin-api' )
const SiteApi = require( './src/api/site-api' )

const Logger = require( './src/bunyan-logger' )
const cmsStore = require( './src/cms-store' )
const DbStore = require( './src/db-store' )
const User = require( './src/user' )

const logger = Logger( DbStore, 'mojule' )

const start = store => {
  const app = express()

  app.use( compression() )

  app.deps = {
    stores: {
      cms: store
    },
    logger
  }

  const serverLogger = app.deps.logger.child( '/server' )

  passport.serializeUser( ( user, done ) => {
    done( null, user._id )
  })

  passport.deserializeUser( ( req, id, done ) => {
    app.deps.stores.cms.getP( 'user' )
      .then( users => {
        const user =  users.find( u => u._id === id )

        if( user ){
          done( null, user )
          return
        }

        const siteApi = SiteApi( DbStore, app.deps, req.session )

        siteApi.getStore( app.deps.stores, req.session.currentSite )
          .then(
            store => store.getP( 'user' )
          )
          .then(
            users => {
              const user = users.find( u => u._id === id )

              if( user ){
                done( null, user )
                return
              }

              throw Error( 'User not found' )
            }
          )
      })
      .catch( err => done( err ) )
  })

  passport.use(
    new LocalStrategy({
      usernameField: 'login.email',
      passwordField: 'login.password',
      passReqToCallback: true
    },

    ( req, username, password, done ) => {
      serverLogger.info( { message: { username } }, 'Login attempt' )

      const error = { message: 'Invalid email or password' }

      let userStore

      //try and find a CMS user first - if not found try to find a site user
      const tryFindUser = () =>
        app.deps.stores.cms.getP( 'user' )
          .then( users => {
            const user = users.find( u => u.email === username )

            if( user ){
              userStore = app.deps.stores.cms
              return user
            }

            const siteApi = SiteApi( DbStore, app.deps, req.session )

            let siteStore

            return siteApi.getStore( app.deps.stores, req.session.currentSite )
              .then( store => {
                siteStore = store

                return store.getP( 'user' )
              })
              .then( users => {
                const user = users.find( u => u.email === username )

                if( user ){
                  userStore = siteStore

                  return user
                } else {
                  return null
                }
              })
          })

      tryFindUser()
        .then( user => {
          if( !user ){
            serverLogger.info( { message: { username } }, 'User not found' )

            done( null, false, error )

            return
          }

          if( User.verify( user, password ) ){
            serverLogger.info( { message: user._id }, 'Login success' )

            const now = (new Date()).toJSON()

            user._lastLogin = now

            userStore.saveP( user )
              .then( user => {
                done( null, user )
              })
          } else {
            serverLogger.info( { message: user._id }, 'Password wrong' )

            done( null, false, error )
          }
        })
        .catch( err => done( err ) )
    }
  ))

  app.use( cookieParser() )
  app.use( bodyParser.json({ limit: '10mb' }) )
  app.use( bodyParser.urlencoded({ extended: true, limit: '10mb' }) )
  app.use( session({
    secret: 'Cha75pucr2Stufev',
    resave: false,
    saveUninitialized: false
  }))
  app.use( flash() )
  app.use( passport.initialize() )
  app.use( passport.session() )
  app.use( express.static( 'files' ) )
  app.set( 'view engine', 'html' )
  app.set( 'layout', 'layout' )

  app.enable( 'view cache' )

  templates.init( './views', '.html', err => {
    if( err ){
      app.deps.logger.error( err )

      throw err
    } else {
      app.engine( 'html', templates.render )

      app[ 'template-engine' ] = templates

      controllers( app, passport )

      pluginApi.load()
        .then( plugins => {
          app.plugins = plugins

          const server = app.listen( process.env.PORT || 3000, () => {
            const host = server.address().address
            const port = server.address().port

            serverLogger.info( { message: { host, port } }, 'listening' )
          })
        })
        .catch( serverLogger.error )
    }
  })
}

cmsStore.init()
  .then( store => start( store ) )
  .catch( err => logger.error( err ) )
