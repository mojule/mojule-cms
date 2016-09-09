'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const getCurrentSite = req => {
    const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
    const fullUrl = req.protocol + '://' + req.get( 'host' ) + req.originalUrl
    return siteApi.getSite( req.user, fullUrl )
  }

  return {
    route: '/cms/plugins/:name',

    isPublic: true,

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const name = req.params.name

      let siteStore
      let site
      let plugin

      getCurrentSite( req )
        .then( currentSite => {
          if ( !currentSite ) {
            throw new Error( 'Not found' )
          } else {
            site = currentSite
          }
        })
        .then(() => siteApi.getStore( app.deps.stores, site ) )
        .then( store => { siteStore = store })
        .then(() => {
          plugin = app.plugins.find( p => p.site === site.name && p.name === name )

          if ( !plugin ) {
            throw new Error( 'Not found' )
          }
        })
        .then(() => siteStore.loadP( name ) )
        .then( data => data || plugin.data )
        .then( data => plugin.server( data ) )
        .then( data => siteStore.saveP( data, true ) )
        .then( data => res.json( data ) )
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        }        )
    }
  }
}
