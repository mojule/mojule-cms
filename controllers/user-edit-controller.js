'use strict'

const path = require( 'path' )
const emailer = require( '../src/email' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const claims = require( '../src/claims' )
const utils = require( '../src/utils/utils' )
const templateNames = require( '../src/template-names' )

const getViewModel = ( editor, user, site, form, templatesDictionary ) => Object.assign(
  {
    title: 'mojule',
    icon: 'user',
    subtitle: user.email,
    user: {
      email: editor.email,
      id: editor._id
    },
    form,
    templates: templateNames.common.map( key => {
      return {
        key,
        template: templatesDictionary[key].template
      }
    }),
    id: user._id
  },
  new UiModel( site )
)

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const userApi = require( '../src/api/user-api' )( app.deps.stores.cms, emailer )
  const store = app.deps.stores.cms

  return {
    route: '/cms/users/:id',

    requireClaims: ['editUser'],

    get: ( req, res ) => {
      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const formOptions = {
        action: '/cms/users/' + id,
        submitLabel: 'Update User'
      }

      const editor = req.user
      let user

      store.loadP( id )
        .then( editUser => {
          if ( editUser ) {
            user = editUser
          } else {
            throw new Error( 'User not found' )
          }
        })
        .then(() => userApi.getSites( editor ) )
        .then( sites => {
          const editorClaims = claims.getClaims( editor ).map( claim => {
            return {
              name: claim.label,
              _id: claim.key,
              selected: user.claims.includes( claim.key ),
              icon: 'key'
            }
          })

          const siteReferences = sites.map( site => {
            const ref = Reference( site )

            ref.selected = user.sites.some( s => s._id === site._id )
            ref.icon = 'globe'

            return ref
          })

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

          const viewModel = getViewModel( editor, user, req.session.currentSite, form, app['template-engine'].templates.dictionary )

          res.render( 'user-edit', viewModel )
        }
        )
        .catch(
        err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        }
        )
    },
    post: ( req, res ) => {
      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const editor = req.user

      let user

      store.loadP( id )
        .then( currentUser => {
          if ( currentUser ) {
            user = currentUser
          } else {
            throw new Error( 'User not found' )
          }
        })
        .then(() => userApi.edit( editor, user, req.body ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/users' )
          } else {
            const viewModel = getViewModel( editor, user, req.session.currentSite, result.data, app['template-engine'].templates.dictionary )
            res.render( 'user-edit', viewModel )
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
