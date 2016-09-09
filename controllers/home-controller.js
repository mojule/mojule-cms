'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const PageRenderModel = require( '../models/page-render-model' )
const Configurator = require( '../src/configurator' )

const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

module.exports = function ( app, passport ) {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const templates = app['template-engine'].templates

  const getUserOptions = ( pageApi, store, req, res ) => {
    //rare example of weak not equals - allows checking for null or undefined
    const userOptions = {
      isLoggedIn: req.user != undefined
    }

    if ( userOptions.isLoggedIn ) {
      return Promise.resolve(
        Object.assign(
          userOptions,
          {
            email: req.user.email,
            id: req.user._id,
            changePasswordUrl: '/cms/changepassword/' + req.session.currentSite._id,
            logoutUrl: '/cms/logout'
          }
        )
      )
    }

    let registerUrl
    let loginUrl

    return store.getP( 'form' )
      .then( forms => forms.find( f => f.formType === 'register' ) )
      .then( registerForm => {
        if ( !registerForm || !registerForm.registerPage || !registerForm.loginPage ) {
          loginUrl = '/cms/login/' + req.session.currentSite._id
          return Promise.resolve( false )
        }

        return store.loadP( registerForm.registerPage._id )
          .then( page => pageApi.getRoute( page ) )
          .then( registerPageRoute => {
            registerUrl = registerPageRoute
          })
          .then(() => store.loadP( registerForm.loginPage._id ) )
          .then( page => pageApi.getRoute( page ) )
          .then( loginPageRoute => {
            loginUrl = loginPageRoute
          })
      })
      .then(() => Object.assign(
        userOptions,
        {
          loginUrl,
          registerUrl,
          forgotUrl: '/cms/resetpassword/' + req.session.currentSite._id,
        }
      ) )
  }

  return {
    //controller must be loaded last or this wildcard will catch ALL THE THINGS
    route: '*',

    isPublic: true,

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      const fullUrl = req.protocol + '://' + req.get( 'host' ) + req.originalUrl

      let site
      let pageApi
      let fileApi
      let page
      let userOptions
      let siteStore

      siteApi.getSite( req.user, fullUrl )
        .then( siteFromUrl => {
          site = siteFromUrl
        })
        .then(() => siteApi.getStore( app.deps.stores, site ) )
        .then( store => {
          siteStore = store

          return require( '../src/api/page-api' )( site, siteStore, req.session )
        })
        .then( api => {
          pageApi = api
        })
        .then(() => pageApi.getPage( req.path ) )
        .then( currentPage => {
          page = currentPage
        })
        .then(() => getUserOptions( pageApi, siteStore, req, res ) )
        .then( options => {
          userOptions = options
        })
        .then(() => pageApi.render( page, templates, req.query, userOptions ) )
        .then( html => {
          const cssBundles = []

          if ( Array.isArray( site.stylesheets ) && site.stylesheets.length > 0 ) {
            cssBundles.push( '/files/css' )
          }

          if ( Array.isArray( page.stylesheets ) && page.stylesheets.length > 0 ) {
            cssBundles.push( '/files/css/' + page._id )
          }

          const model = new PageRenderModel( html, site, cssBundles )
          const plugins = app.plugins.filter( p => p.site === site.name )
          const pluginUrls = plugins.map( p => '/plugins/' + p.site + '/' + p.name )

          pluginUrls.forEach( url => model.scripts.push( { url }) )

          const azureSettings = configurator.azure()

          if ( azureSettings && typeof azureSettings.appinsightskey === 'string' ) {
            model.insightsKey = configurator.azure().appinsightskey
          }

          res.render( 'page-render', model )
        })
        .catch( err => {
          const status = utils.httpStatus._404NotFound
          res.status( status.code )
          logger.warn( status.toFormat( req.url ) )
          res.render( 'error', { status: status, message: req.url })
        })
    }
  }
}
