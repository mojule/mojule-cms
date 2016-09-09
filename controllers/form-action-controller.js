'use strict'
const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const requestIp = require( 'request-ip' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const determineSite = req => {
    const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

    const fullUrl = req.protocol + '://' + req.get( 'host' ) + req.originalUrl

    return siteApi.getSite( req.user, fullUrl )
  }

  return {
    route: '/cms/action/:id',

    isPublic: true,

    post: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const clientIp = requestIp.getClientIp( req )

      let site
      let siteStore
      let formApi

      determineSite( req )
        .then( foundSite => { site = foundSite })
        .then(() => siteApi.getStore( app.deps.stores, site ) )
        .then( foundStore => {
          siteStore = foundStore
          formApi = require( '../src/api/form-api' )( site, siteStore )
        })
        .then(() => siteStore.loadP( id ) )
        .then( form => formApi.action( form, req.body, clientIp ) )
        .then( result => {
          req.session[id] = result

          return result.data.returnId
        })
        .then( pageId => siteStore.loadP( pageId ) )
        .then( page => {
          const pageApi = require( '../src/api/page-api' )( site, siteStore, req.session )

          return pageApi.getRoute( page )
        })
        .then( route => {
          res.redirect( route + '?p=' + utils.randomId() + '#' + id )
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
