'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const TemplateModel = require( '../src/view-models/template-model' )

const templateModel = TemplateModel()

const getViewModel = ( user, site, form ) =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'puzzle-piece',
      subtitle: 'New Prefab',
      user: {
        email: user.email,
        id: user._id
      },
      form
    },
    new UiModel( site )
  )

const formOptions = {
  submitLabel: 'Create Prefab',
  action: '/cms/templates/create'
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/templates/create',

    requireClaims: ['createTemplate'],

    get: ( req, res ) => {
      const form = templateModel.form( formOptions )
      const viewModel = getViewModel( req.user, req.session.currentSite, form )

      res.render( 'template-create', viewModel )
    },

    post: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const site = req.session.currentSite

      siteApi.getStore( app.deps.stores, site )
        .then( siteStore => require( '../src/api/template-api' )( site, siteStore, req.session ) )
        .then( templateApi => templateApi.create( req.user, req.body ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/templates' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data )

            res.render( 'template-create', viewModel )
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
