'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const imageApi = require( '../src/api/image-api' )()
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/files/css/:pageId?',

    isPublic: true,

    get: ( req, res ) => {
      const pageId = req.params.pageId
      const isPage = pageId != null

      if ( !utils.isOptDbIdentifier( pageId ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const fullUrl = req.protocol + '://' + req.get( 'host' ) + req.originalUrl

      let site
      let siteStore
      let styleFiles
      let page
      let pageApi
      let fileApi

      const pageBundle = () => siteStore.loadP( pageId )
        .then( page => pageApi.getStyleFiles( page ) )
        .then( styleFiles => fileApi.bundle( styleFiles, pageId + '.css' ) )

      const siteBundle = () => siteApi.getStyleFiles( app.deps.stores, site )
        .then( styleFiles => fileApi.bundle( styleFiles, site._id + '.css' ) )

      siteApi.getSite( req.user, fullUrl )
        .then( siteFromUrl => {
          site = siteFromUrl
        })
        .then(() => siteApi.getStore( app.deps.stores, site ) )
        .then( store => { siteStore = store })
        .then(() => require( '../src/api/page-api' )( site, siteStore, req.session ) )
        .then( api => { pageApi = api })
        .then(() => require( '../src/api/file-api' )( siteStore, site ) )
        .then( api => { fileApi = api })
        .then(() => {
          if ( isPage ) {
            return pageBundle()
          } else {
            return siteBundle()
          }
        })
        .then( bundlePath => {
          res.sendFile( bundlePath )
        })
        .catch( err => {
          const status = utils.httpStatus._404NotFound
          res.status( status.code )
          logger.error( status.toFormat( req.url ) )
          res.render( 'error', { status: status, message: req.url })
        })
    }
  }
}
