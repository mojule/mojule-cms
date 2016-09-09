'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const SiteModel = require( '../src/view-models/site-model' )

const siteModel = SiteModel()

const getViewModel = ( user, site, form ) => Object.assign(
  {
    title: 'mojule',
    icon: 'globe',
    subtitle: 'New Site',
    user: {
      email: user.email,
      id: user._id
    },
    form
  },
  new UiModel( site )
)

const formOptions = {
  submitLabel: 'Create Site'
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/sites/create',

    requireClaims: ['createSite'],

    get: ( req, res ) => {
      const form = siteModel.form( formOptions )
      const viewModel = getViewModel( req.user, req.session.currentSite, form )

      res.render( 'site-create', viewModel )
    },

    post: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      siteApi.create( req.user, req.body )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/sites' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data )
            res.render( 'site-create', viewModel )
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
