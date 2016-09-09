'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const tagsApi = require( '../src/tags' )()

const getViewModel = ( user, site, libraryItems ) => {
  const model = Object.assign( {
    title: 'mojule',
    icon: 'puzzle-piece',
    subtitle: 'Prefabs',
    user: {
      email: user.email,
      id: user._id
    },
    library: {
      size: 4,
      items: libraryItems
    },
    tags: tagsApi.viewModels( libraryItems )
  }, new UiModel( site ) )

  model.scripts.push( {
    url: '/js/filter-tags.js'
  })

  return model
}

module.exports = function ( app, passport ) {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/templates',

    requireClaims: ['editTemplate'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( store => store.getP( 'template' ) )
        .then( templates => {
          const templateItems = templates.map( t => {
            const tags = Array.isArray( t.tags ) ? t.tags : []

            return {
              url: '/cms/templates/' + t._id,
              title: t.name || t.values.name,
              requireClaims: ['editTemplate'],
              icon: 'puzzle-piece',
              tags,
              data: [{
                key: 'tags',
                value: tags.join( ' ' )
              }]
            }
          })

          const items = [{
            url: '/cms/templates/create',
            title: 'Create Prefab',
            icon: 'plus-circle',
            requireClaims: ['createTemplate']
          }].concat( templateItems )

          const libraryItems = claims.filterByClaims( items, req.user.claims )

          const viewModel = getViewModel( req.user, req.session.currentSite, libraryItems )

          res.render( 'ui-home', viewModel )
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
