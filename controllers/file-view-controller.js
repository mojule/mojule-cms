'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const imageApi = require( '../src/api/image-api' )()
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const determineSite = req => {
    const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
    const fullUrl = req.protocol + '://' + req.get( 'host' ) + req.originalUrl

    return siteApi.getSite( req.user, fullUrl )
  }

  return {
    route: '/files/:id/:p1?/:p2?/:p3?/:p4?',

    isPublic: true,

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

      const resolveImage = ( file, inPath ) => {
        //remove any falsey (null or undefined) params
        const params = [req.params.p1, req.params.p2, req.params.p3, req.params.p4].filter( p => !!p )

        if ( params.length > 0 ) {
          //remove last param
          params.pop()

          imageApi.resize( file, inPath, params )
            .then( filePath => {
              const fullPath = path.resolve( __dirname, '..', filePath )

              res.sendFile( fullPath )
            })
        }
      }

      const resolveFile = site => {
        if ( !site ) {
          throw new Error( 'No site found' )
        }

        let fileApi

        return siteApi.getStore( app.deps.stores, site )
          .then( store => {
            fileApi = require( '../src/api/file-api' )( store, site )
            return store
          })
          .then( store => store.loadP( id ) )
          .then( file => {
            const filePath = fileApi.getPath( file )

            if ( imageApi.isRaster( file ) ) {
              resolveImage( file, filePath )
            } else {
              const fullPath = path.resolve( __dirname, '..', filePath )

              res.sendFile( fullPath )
            }
          })
      }

      determineSite( req )
        .then( resolveFile )
        .catch( err => {
          const status = utils.httpStatus._404NotFound
          res.status( status.code )
          logger.error( status.toFormat( req.url ) )
          res.render( 'error', { status: status, message: req.url })
        })
    }
  }
}
