'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const tagsApi = require( '../src/tags' )()

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/forms',

    requireClaims: ['editForm'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( store => store.getP( 'form' ) )
        .then( forms => {
          const formItems = forms.map( f => {
            const tags = Array.isArray( f.tags ) ? f.tags : []
            return {
              url: '/cms/forms/' + f._id,
              title: f.name,
              requireClaims: ['editForm'],
              icon: 'edit',
              tags,
              data: [{
                key: 'tags',
                value: tags.join( ' ' )
              }]
            }
          })

          const items = [{
            url: '/cms/forms/create',
            title: 'Create Form',
            icon: 'plus-circle',
            requireClaims: ['createForm']
          }].concat( formItems )

          const libraryItems = claims.filterByClaims( items, req.user.claims )

          const viewModel = Object.assign(
            {
              title: 'mojule',
              icon: 'edit',
              subtitle: 'Forms',
              user: {
                email: req.user.email,
                id: req.user._id
              },
              library: {
                size: 4,
                items: libraryItems
              },
              tags: tagsApi.viewModels( libraryItems )
            },
            new UiModel( req.session.currentSite )
          )

          viewModel.scripts.push( {
            url: '/js/filter-tags.js'
          })

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
