'use strict'

const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const path = require( 'path' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/files/trash/:id',

    requireClaims: ['editFile'],

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

      let fileApi

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => {
          fileApi = require( '../src/api/file-api' )( siteStore, req.session.currentSite )

          return siteStore
        })
        .then( siteStore => siteStore.loadP( id ) )
        .then( file => fileApi.trash( file ) )
        .then(() => { res.redirect( '/cms/files' ) })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
