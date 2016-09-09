'use strict'

const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const path = require( 'path' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/db/:id?',

    requireClaims: ['master'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const id = req.params.id

      if ( !utils.isOptDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      if ( id ) {
        siteApi.getStore( app.deps.stores, req.session.currentSite )
          .then( siteStore => siteStore.loadP( id ) )
          .then( item => {
            const json = JSON.stringify( item, null, 2 )
            res.set( 'Content-Type', 'text/plain' )
            res.send( json )
          })

        return
      }

      let json = ''

      if ( !req.user.claims.includes( 'master' ) ) {
        const status = utils.httpStatus._404NotFound
        res.status( status.code )
        logger.warn( status.toFormat( req.url, + ' user not master' ) )
        res.render( 'error', { status: status, message: req.url + ' user not master' })
        return
      }

      app.deps.stores.cms.allP()
        .then( items => {
          json = items.reduce(( result, item ) => {
            if ( item.key === 'user' ) {
              delete item.salt
              delete item.password
            }

            return result + JSON.stringify( item, null, 2 ) + '\n\n'
          }, '' )

          return items
        })
        .then( items => Promise.all(
          items.filter( i => i.key === 'site' )
            .map( site => DbStore( site.db ).allP() )
        ))
        .then( siteItems => siteItems.reduce( ( result, arr ) => {
          return result.concat( arr )
        }, [] ))
        .then( allSiteItems => json + allSiteItems.reduce(( result, item ) => {
          return result + JSON.stringify( item, null, 2 ) + '\n\n'
        }, '' ))
        .then( text => {
          res.set( 'Content-Type', 'text/plain' )
          res.send( text )
        })
    }
  }
}