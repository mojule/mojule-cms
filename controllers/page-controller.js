'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const tagsApi = require( '../src/tags' )()
const SiteApi = require( '../src/api/site-api' )
const UserApi = require( '../src/api/user-api' )
const emailer = require( '../src/email' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/pages',

    requireClaims: ['editPage'],

    get: ( req, res ) => {
      const siteApi = SiteApi( DbStore, app.deps, req.session )
      const userApi = UserApi( app.deps.stores.cms, emailer )
      let settings
      let siteSettings

      userApi.settings( req.user )
        .then( userSettings => {
          settings = userSettings
          siteSettings = settings.site[ req.session.currentSite._id ]
        })
        .then( () => siteApi.getStore( app.deps.stores, req.session.currentSite ) )
        .then( store => store.getP( 'page' ) )
        .then( pages => {
          const pageItems = pages.filter( p => {
            if( siteSettings && siteSettings.restrict ) return ( p._id in siteSettings.pages )

            return true
          }).map( p => {
            const tags = Array.isArray( p.tags ) ? p.tags.slice() : []

            return {
              url: '/cms/pages/' + p._id,
              title: p.name,
              requireClaims: ['editPage'],
              icon: 'sitemap',
              tags,
              data: [{
                key: 'tags',
                value: tags.join( ' ' )
              }]
            }
          })

          const items = [{
            url: '/cms/pages/create',
            title: 'Create Page',
            icon: 'plus-circle',
            requireClaims: ['createPage']
          }].concat( pageItems )

          const libraryItems = claims.filterByClaims( items, req.user.claims )

          const viewModel = Object.assign(
            {
              title: 'mojule',
              icon: 'sitemap',
              subtitle: 'Pages',
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
        }).catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
