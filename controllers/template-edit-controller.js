'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const TemplateModel = require( '../src/view-models/template-model' )
const utils = require( '../src/utils/utils' )

const templateModel = TemplateModel()

const getViewModel = ( user, site, form, template ) =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'puzzle-piece',
      subtitle: template.name,
      user: {
        email: user.email,
        id: user._id
      },
      id: template._id,
      form
    },
    new UiModel( site )
  )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/templates/:id',

    requireClaims: ['editTemplate'],

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

      const formOptions = {
        action: '/cms/templates/' + id,
        submitLabel: 'Update Prefab'
      }

      siteApi.getStore( app.deps.stores, site )
        .then( siteStore => siteStore.loadP( id ) )
        .then( template => {
          //hack
          template.name = template.name || template.values.name

          const form = templateModel.form( formOptions, template )

          const viewModel = getViewModel( req.user, site, form, template )

          res.render( 'template-edit', viewModel )
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
      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const site = req.session.currentSite

      let templateApi
      let template

      siteApi.getStore( app.deps.stores, site )
        .then( siteStore => {
          templateApi = require( '../src/api/template-api' )( site, siteStore, req.session )
          return siteStore
        })
        .then( siteStore => siteStore.loadP( id ) )
        .then( editTemplate => { template = editTemplate })
        .then(() => templateApi.edit( template, req.body ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/templates' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data, template )

            res.render( 'template-edit', viewModel )
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
