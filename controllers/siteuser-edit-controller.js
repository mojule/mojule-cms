'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const emailer = require( '../src/email' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )

const getViewModel = ( editor, user, site, form ) => Object.assign(
  {
    title: 'mojule',
    icon: 'users',
    subtitle: user.email,
    user: {
      email: editor.email,
      id: editor._id
    },
    id: user._id,
    form
  },
  new UiModel( site )
)

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/siteusers/:id',

    requireClaims: ['editUser'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      const id = req.params.id

      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const site = req.session.currentSite
      const claims = Array.isArray( site.claims ) ? site.claims : []

      let store
      let userApi

      const formOptions = {
        action: '/cms/siteusers/' + id,
        submitLabel: 'Update User'
      }

      const editor = req.user
      let user

      siteApi.getStore( app.deps.stores, site )
        .then( siteStore => {
          store = siteStore
          userApi = require( '../src/api/user-api' )( siteStore, emailer )
        })
        .then( () => store.loadP( id ) )
        .then( editUser => {
          if ( editUser ) {
            user = editUser
          } else {
            throw new Error( 'User not found' )
          }
        })
        .then( () => {
          const editorClaims = claims.map( claim => {
            const id = utils.toIdentifier( claim )
            return {
              name: claim,
              _id: id,
              selected: Array.isArray( user.claims ) && !!user.claims.find( c => c.name === claim ),
              icon: 'key'
            }
          })

          const siteReference = Reference( site )

          siteReference.selected = user.sites.some( s => s._id === site._id )
          siteReference.icon = 'globe'

          const siteReferences = [siteReference]

          const schemaData = {
            name: {
              default: user.name
            },
            email: {
              default: user.email
            },
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
          const form = userModel.form( formOptions )

          const viewModel = getViewModel( editor, user, req.session.currentSite, form )

          res.render( 'siteuser-edit', viewModel )
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
      const site = req.session.currentSite
      const claims = Array.isArray( site.claims ) ? site.claims : []

      let store
      let userApi

      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const formOptions = {
        action: '/cms/siteusers/' + id,
        submitLabel: 'Update User'
      }

      const editor = req.user
      let user

      siteApi.getStore( app.deps.stores, site )
        .then( siteStore => {
          store = siteStore
          userApi = require( '../src/api/user-api' )( siteStore, emailer )
        })
        .then( () => store.loadP( id ) )
        .then( editUser => {
          if ( editUser ) {
            user = editUser
          } else {
            throw new Error( 'User not found' )
          }
        })
        .then( () => userApi.edit( editor, user, req.body, claims, site ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/siteusers' )
          } else {
            const viewModel = getViewModel( editor, user, req.session.currentSite, result.data )
            res.render( 'siteuser-edit', viewModel )
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
