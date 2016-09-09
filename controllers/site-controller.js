'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )
const claims = require( '../src/claims' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const UiModel = require( '../models/ui-model' )
  const store = app.deps.stores.cms

  return {
    route: '/cms/sites',

    requireClaims: ['editSite'],

    get: ( req, res ) => {
      store.getP( 'site' )
        .then( sites => {
          let items = [
            {
              require: ['createSite'],
              url: '/cms/sites/create',
              title: 'Create Site',
              icon: 'plus-circle',
              requireClaims: ['createSite']
            },
            {
              require: ['createSite'],
              url: '/cms/sites/import',
              title: 'Restore Site Backup',
              icon: 'file-zip-o',
              requireClaims: ['createSite']
            }
          ]
            .concat( sites.map( site => {
              return {
                _id: site._id,
                url: '/cms/sites/' + site._id,
                title: site.name,
                icon: 'globe',
                requireClaims: ['editSite']
              }
            }) )

          if ( !req.user.claims.includes( 'master' ) ) {
            items = items.filter( item => {
              if ( !item._id ) return true

              return req.user.sites.some( s => s._id === item._id )
            })
          }

          const libraryItems = claims.filterByClaims( items, req.user.claims )

          const viewModel = Object.assign(
            {
              title: 'mojule',
              icon: 'globe',
              subtitle: 'Sites',
              user: {
                email: req.user.email,
                id: req.user._id
              },
              library: {
                size: 4,
                items: libraryItems
              }
            },
            new UiModel( req.session.currentSite )
          )

          res.render( 'ui-home', viewModel )
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
