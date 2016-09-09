'use strict'

const SiteApi = require( '../src/api/site-api' )
const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/sitemap',

    isPublic: true,

    get: ( req, res ) => {
      const siteApi = SiteApi( DbStore, app.deps, req.session )

      siteApi.sitemap( app.deps.stores, req.session.currentSite )
        .then( xml => {
          res.set( 'Content-Type', 'text/xml' )
          res.send( xml )
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
