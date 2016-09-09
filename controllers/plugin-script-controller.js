'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )


module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/plugins/:site/:name',

    isPublic: true,

    get: ( req, res ) => {
      const site = req.params.site
      const name = req.params.name

      const plugin = app.plugins.find( p => p.site === site && p.name === name )

      if ( plugin ) {
        res.set( 'Content-Type', 'application/javascript' )
        res.send( plugin.client )
      } else {
        const status = utils.httpStatus._404NotFound
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
      }
    }
  }
}
