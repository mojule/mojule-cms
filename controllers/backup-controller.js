'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/backup',

    get: ( req, res ) => {
      const cmsApi = require( '../src/api/cms-api' )( DbStore, app.deps, req.session )

      const filename = [
        'mojule-',
        utils.toIdentifier(( new Date() ).toJSON() ),
        '.zip'
      ].join( '' )

      cmsApi.backup()
        .then( zip => {
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
