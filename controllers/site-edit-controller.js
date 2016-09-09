'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const SiteModel = require( '../src/view-models/site-model' )
const utils = require( '../src/utils/utils' )
const templateNames = require( '../src/template-names' )

const getViewModel = ( user, site, currentSite, form, templatesDictionary ) => Object.assign(
  {
    title: 'mojule',
    icon: 'globe',
    subtitle: 'Edit Site',
    user: {
      email: user.email,
      id: user._id
    },
    id: site._id,
    form,
    templates: templateNames.common.map( key => {
      return {
        key,
        template: templatesDictionary[key].template
      }
    })
  },
  new UiModel( currentSite )
)

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const store = app.deps.stores.cms

  return {
    route: '/cms/sites/:id',

    requireClaims: ['editSite'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const fileApi = require( '../src/api/file-api' )( store, req.session.currentSite )

      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const formOptions = {
        action: '/cms/sites/' + id,
        submitLabel: 'Update Site'
      }

      let site
      let stylesheets

      store.loadP( id )
        .then( currentSite => {
          if ( currentSite ) {
            site = currentSite
          } else {
            throw new Error( 'Site not found' )
          }
        })
        .then(() => siteApi.getStore( app.deps.stores, site ) )
        .then( siteStore => siteStore.getP( 'file' ) )
        .then( files => {
          stylesheets = files.filter(
            f =>
              f.mimetype === 'text/css'
          )
        })
        .then(() => {
          const stylesheetRefs = stylesheets.map( s => {
            return {
              _id: s._id,
              name: s.originalname,
              icon: fileApi.getIcon( s )
            }
          })

          const dynamicSchema = {
            stylesheets: {
              items: {
                enum: stylesheetRefs
              }
            }
          }

          const siteModel = SiteModel( dynamicSchema )
          const form = siteModel.form( formOptions, site )
          const viewModel = getViewModel( req.user, site, req.session.currentSite, form, app['template-engine'].templates.dictionary )

          res.render( 'site-edit', viewModel )
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

      let site

      store.loadP( id )
        .then( currentSite => {
          if ( currentSite ) {
            site = currentSite
          } else {
            throw new Error( 'Site not found' )
          }
        })
        .then(() => siteApi.edit( app.deps.stores, site, req.body ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/sites' )
          } else {
            const viewModel = getViewModel( req.user, site, req.session.currentSite, result.data, app['template-engine'].templates.dictionary )

            res.render( 'site-edit', viewModel )
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
