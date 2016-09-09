'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const PageModel = require( '../src/view-models/page-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )
const templateNames = require( '../src/template-names' )

const getViewModel = ( user, site, form, templatesDictionary, id ) => Object.assign(
  {
    title: 'mojule',
    icon: 'sitemap',
    subtitle: 'Edit Page',
    user: {
      email: user.email,
      id: user._id
    },
    id: id,
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

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/pages/:id',

    requireClaims: ['editPage'],

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
      let pages
      let siteStore
      let fileApi

      siteApi.getStore( app.deps.stores, site )
        .then( store => {
          siteStore = store
          fileApi = require( '../src/api/file-api' )( store, req.session.currentSite )
        })
        .then( () => siteStore.getP( 'page' ) )
        .then( allPages => {
          pages = allPages
          return siteStore.getP( 'file' )
        })
        .then( files => {
          const page = pages.find( p => p._id === id )

          const parentPages = pages.filter( p => p._id !== id ).map( p => {
            const reference = Reference( p )

            reference.selected = page.parent && p._id === page.parent._id

            return reference
          })

          const pageNames = pages.filter( p => p._id !== id ).map( p => p.name )

          const pageSlugs = pages.filter( p => p._id !== id ).map( p => p.slug )

          const stylesheets = files.filter( f => f.mimetype === 'text/css' )

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
              selected: Array.isArray( page.requireClaims ) && !!page.requireClaims.find( c => c.name === claim ),
              icon: 'key'
            })) : []

          const dynamicSchema = {
            name: {
              not: {
                enum: pageNames
              }
            },
            slug: {
              not: {
                enum: pageSlugs
              }
            },
            stylesheets: {
              items: {
                enum: stylesheetRefs
              }
            },
            requireClaims: {
              items: {
                enum: customClaims
              }
            },
            parent: {
              enum: parentPages
            }
          }

          if ( page.name === 'Home' ) {
            dynamicSchema.name.format = 'hidden'

            dynamicSchema.slug.format = 'hidden'

            dynamicSchema.parent.format = 'hidden'
            dynamicSchema.parent.$ref = null
            dynamicSchema.parent.type = 'string'

            delete dynamicSchema.parent.enum
          }

          const formOptions = {
            action: '/cms/pages/' + id,
            submitLabel: 'Update Page'
          }

          const pageModel = PageModel( dynamicSchema )
          const form = pageModel.form( formOptions, page )

          const viewModel = getViewModel( req.user, req.session.currentSite, form, app['template-engine'].templates.dictionary, id )

          res.render( 'page-edit', viewModel )
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

      let siteStore
      let pageApi

      siteApi.getStore( app.deps.stores, site )
        .then( store => {
          siteStore = store
          pageApi = require( '../src/api/page-api' )( site, siteStore, req.session )
        })
        .then( () => siteStore.loadP( id ) )
        .then( page => pageApi.edit( page, req.body ) )
        .then( result => {
          if ( result.valid ) {
            res.redirect( '/cms/pages' )
          } else {
            const viewModel = getViewModel( req.user, req.session.currentSite, result.data, app['template-engine'].templates.dictionary, id )
            res.render( 'page-edit', viewModel )
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
