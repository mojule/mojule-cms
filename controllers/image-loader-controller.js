'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const imageApi = require( '../src/api/image-api' )()

  return {
    route: '/cms/image-loader',

    requireClaims: ['master'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      let siteStore
      let fileApi

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( store => {
          fileApi = require( '../src/api/file-api' )( store )
          siteStore = store

          return store
        })
        .then( store => store.getP( 'file' ) )
        .then( files => files.filter( file => imageApi.isImage( file ) ) )
        .then( images => images.map( image =>
          imageApi.getUrl( image, {
            strategy: 'fitToRect',
            width: 48,
            height: 48
          })
        ))
        .then( imageUrls => {
          imageUrls = imageUrls.filter( src => !src.endsWith( 'svg' ) )
          const model = {}

          model.images = imageUrls.map( src => ({ src }))

          res.render( 'image-loader', model );
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
