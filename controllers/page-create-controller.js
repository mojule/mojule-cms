'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const PageModel = require( '../src/view-models/page-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )
const templateNames = require( '../src/template-names' )

const getViewModel = ( user, site, form, templatesDictionary ) => Object.assign(
  {
    title: 'mojule',
    icon: 'sitemap',
    subtitle: 'New Page',
    user: {
      email: user.email,
      id: user._id
    },
    form,
    templates: templateNames.common.map( key => {
      return {
        key,
        template: templatesDictionary[ key ].template
      }
    })
  },
  new UiModel( site )
)

const formOptions = {
  submitLabel: 'Create Page'
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/pages/create',

    requireClaims: ['createPage'],

    get: ( req, res ) => {
      const site = req.session.currentSite
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      let siteStore
      let stylesheets
      let fileApi

      siteApi.getStore( app.deps.stores, site )
        .then( store => {
          siteStore = store
          fileApi = require( '../src/api/file-api' )( store, req.session.currentSite )
        })
        .then( () => siteStore.getP( 'file' ) )
        .then( files => {
          stylesheets = files.filter( f => f.mimetype === 'text/css' )
        })
        .then( () => siteStore.getP( 'page' ) )
        .then( pages => {
          const parentPages = pages.map( Reference )
          const pageNames = pages.map( p => p.name )

          parentPages.forEach(
            pageRef => {
              if ( pageRef._id === site.homePage ) {
                pageRef.selected = true
              }
            }
          )

          const stylesheetRefs = stylesheets.map( s => {
            return {
              _id: s._id,
              name: s.originalname,
              icon: fileApi.getIcon( s )
            }
          })

          const customClaims = Array.isArray( site.claims ) ?
            site.claims.map( claim => ({
              name: claim,
              _id: utils.toIdentifier( claim ),
              icon: 'key'
            })) : []

          const dynamicSchema = {
            name: {
              not: {
                enum: pageNames
              }
            },
            slug: {
              format: 'hidden'
            },
            requireClaims: {
              items: {
                enum: customClaims
              }
            },
            stylesheets: {
              items: {
                enum: stylesheetRefs
              }
            },
            parent: {
              enum: parentPages
            }
          }

          const pageModel = PageModel( dynamicSchema )
          const form = pageModel.form( formOptions )

          const viewModel = getViewModel( req.user, req.session.currentSite, form, app['template-engine'].templates.dictionary )

          res.render( 'page-create', viewModel )
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

      siteApi.getStore( app.deps.stores, site )
        .then( siteStore => require( '../src/api/page-api' )( site, siteStore, req.session ) )
        .then( pageApi => pageApi.create( req.user, req.body ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/pages' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data, app['template-engine'].templates.dictionary )
            res.render( 'page-create', viewModel )
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
