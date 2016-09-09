'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/sites/backup/:id',

    requireClaims: ['editSite'],

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

      let site

      app.deps.stores.cms.loadP( id )
        .then( backupSite => { site = backupSite })
        .then(() => siteApi.backup( app.deps.stores, site ) )
        .then( zip => {
          const name = [
            'mojule',
            site.db,
            ( new Date() ).toJSON()
          ].join( '-' );

          const filename = utils.toIdentifier( name ) + '.zip'

          res.setHeader( 'content-disposition', 'attachment; filename=' + filename )
          res.setHeader( 'content-type', 'application/zip' )

          zip.outputStream.pipe( res )
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
