'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const claims = require( '../src/claims' )
const emailer = require( '../src/email' )
const templateNames = require( '../src/template-names' )

const getViewModel = ( user, site, form, templatesDictionary ) => Object.assign(
  {
    title: 'mojule',
    icon: 'user',
    subtitle: 'New User',
    user: {
      email: user.email,
      id: user._id
    },
    form,
    templates: templateNames.common.map( key => {
      return {
        key,
        template: templatesDictionary[key].template
      }
    })
  },
  new UiModel( site )
)

const formOptions = {
  submitLabel: 'Create User'
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const userApi = require( '../src/api/user-api' )( app.deps.stores.cms, emailer )

  return {
    route: '/cms/users/create',

    requireClaims: ['createUser'],

    get: ( req, res ) => {
      userApi.getSites( req.user )
        .then( sites => {
          const editorClaims = claims.getClaims( req.user ).map( claim => {
            return {
              name: claim.label,
              _id: claim.key,
              icon: 'key'
            }
          })

          const siteReferences = sites.map( Reference )

          siteReferences.forEach( ref => {
            ref.icon = 'globe'
          })

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

          const viewModel = getViewModel( req.user, req.session.currentSite, userModel.form( formOptions ), app['template-engine'].templates.dictionary )

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
      userApi.create( req.user, req.body )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/users' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data, app['template-engine'].templates.dictionary )

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
