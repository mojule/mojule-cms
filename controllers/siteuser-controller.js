'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const DbStore = require( '../src/db-store' )

const getViewModel = ( user, site, libraryItems ) => Object.assign(
  {
    title: 'mojule',
    icon: 'users',
    subtitle: 'Site Users',
    user: {
      email: user.email,
      id: user._id
    },
    library: {
      size: 4,
      items: libraryItems
    }
  },
  new UiModel( site )
)

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/siteusers',

    requireClaims: ['editUser'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      let store

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => { store = siteStore })
        .then(() => store.getP( 'user' ) )
        .then( users => {
          const items = [
            {
              require: ['createUser'],
              url: '/cms/siteusers/create',
              title: 'Create User',
              icon: 'plus-circle',
              requireClaims: ['createUser']
            },
            {
              require: ['editUser'],
              url: '/cms/siteusers/csv',
              title: 'Download User Data',
              icon: 'file-excel-o',
              requireClaims: ['editUser']
            }
          ]

          let userItems = users.map(
            user => {
              return {
                id: user._id,
                url: '/cms/siteusers/' + user._id,
                title: user.email,
                icon: 'users',
                requireClaims: ['editUser']
              }
            }
          )

          const libraryItems = claims.filterByClaims( items.concat( userItems ), req.user.claims )

          const viewModel = getViewModel( req.user, req.session.currentSite, libraryItems )

          res.render( 'ui-home', viewModel );
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
