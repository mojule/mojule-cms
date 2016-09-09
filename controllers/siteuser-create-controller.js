'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const emailer = require( '../src/email' )
const utils = require( '../src/utils/utils' )

const getViewModel = ( user, site, form ) => Object.assign(
  {
    title: 'mojule',
    icon: 'users',
    subtitle: 'New Site User',
    user: {
      email: user.email,
      id: user._id
    },
    form
  },
  new UiModel( site )
)

const formOptions = {
  submitLabel: 'Create User'
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/siteusers/create',

    requireClaims: ['createUser'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const claims = Array.isArray( req.session.currentSite.claims ) ? req.session.currentSite.claims : []

      let store

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => {
          store = siteStore
        })
        .then( () => {
          const editorClaims = claims.map( claim => {
            return {
              name: claim,
              _id: utils.toIdentifier( claim ),
              icon: 'key'
            }
          })

          const siteReference = Reference( req.session.currentSite )
          const siteReferences = [siteReference]

          siteReference.selected = true
          siteReference.icon = 'globe'

          const schemaData = {
            claims: {
              items: {
                enum: editorClaims
              }
            },
            sites: {
              items: {
                enum: siteReferences
              }
            }
          }

          const userModel = UserModel( schemaData )

          const viewModel = getViewModel( req.user, req.session.currentSite, userModel.form( formOptions ) )

          res.render( 'user-create', viewModel )
        })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    },

    post: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const claims = Array.isArray( req.session.currentSite.claims ) ? req.session.currentSite.claims : []

      let store
      let userApi

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => {
          store = siteStore
          userApi = require( '../src/api/user-api' )( siteStore, emailer )
        })
        .then( () => userApi.create( req.user, req.body, claims, req.session.currentSite ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/siteusers' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data )

            res.render( 'user-create', viewModel )
          }
        })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
