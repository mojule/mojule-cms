'use strict'

const ComposerDocumentModel = require( '../models/composer-document-model' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const path = require( 'path' )
const SiteApi = require( '../src/api/site-api' )
const PageApi = require( '../src/api/page-api' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/composer-document/:id?',

    requireClaims: ['editPage'],

    get: ( req, res ) => {
      const siteApi = SiteApi( DbStore, app.deps, req.session )
      const id = req.params.id
      if ( !utils.isOptDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      let styleUrls
      let pageApi

      const createComposerModel = () => siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => {
          pageApi = PageApi( req.session.currentSite, siteStore, req.session )

          return siteStore
        })
        .then( siteStore => siteStore.loadP( id ) )
        .then( page => pageApi.getStyles( page ) )
        .then( pageStyles => {
          styleUrls = styleUrls.concat( pageStyles )

          const model = new ComposerDocumentModel( req.session.currentSite, styleUrls )

          res.render( 'composer-document', model )
        })

      siteApi.getStyles( app.deps.stores, req.session.currentSite )
        .then( siteStyles => {
          styleUrls = siteStyles
        })
        .then( () => {
          if ( id ) {
            return createComposerModel()
          } else {
            const model = new ComposerDocumentModel( req.session.currentSite, styleUrls )
            res.render( 'composer-document', model )
          }
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
