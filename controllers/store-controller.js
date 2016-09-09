'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )


module.exports = ( app, passport ) => {
  const DbStore = require( '../src/db-store' )
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )


  return {
    route: '/cms/store/:action/:id?',

    requireClaims: ['editPage'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const action = req.params.action
      const id = req.params.id
      // No bad request checking here.  id is page,template,image NOT db id.

      if ( ['load', 'get'].includes( action ) && id ) {
        siteApi.getStore( app.deps.stores, req.session.currentSite )
          .then( store => require( '../src/api/store-api' )( req.session.currentSite, store, req.session ) )
          .then( storeApi => storeApi[action]( id ) )
          .then( result => res.json( result ) )
          .catch( err => {
            logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          })
      } else {
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
      }
    },

    post: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const action = req.params.action

      if ( action === 'log' ) {
        console.dir( req.body.obj )

        res.json( true )
      } else if ( action === 'save' ) {
        const obj = JSON.parse( req.body.obj )

        siteApi.getStore( app.deps.stores, req.session.currentSite )
          .then( store => require( '../src/api/store-api' )( req.session.currentSite, store, req.session ) )
          .then( storeApi => storeApi.save( obj ) )
          .then( result => res.json( result ) )
          .catch( err => {
            logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          })
      } else {
        const status = utils.httpStatus._404NotFound
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
      }
    }
  }
}
