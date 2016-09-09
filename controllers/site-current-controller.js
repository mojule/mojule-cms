'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const store = app.deps.stores.cms

  return {
    route: '/cms/sites/current/:id',

    get: ( req, res ) => {
      const id = req.params.id;
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      store.loadP( id )
        .then(
        site => {
          if ( site ) {
            req.user.currentSite = site._id
            req.session.currentSite = site
          } else {
            const status = utils.httpStatus._404NotFound
            res.status( status.code )
            logger.error( status.toFormat( req.url ) )
            res.render( 'error', { status: status, message: req.url })
            throw new Error( 'Site not found' )
          }
        }
        )
        .then(() => store.saveP( req.user ) )
        .then(() => { res.redirect( '/cms/sites' ) })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}