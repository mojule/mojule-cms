'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )
const claims = require( '../src/claims' )
const UiModel = require( '../models/ui-model' )

const getViewModel = ( user, site, libraryItems ) => Object.assign(
  {
    title: 'mojule',
    icon: 'user',
    subtitle: 'CMS Users',
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
  const store = app.deps.stores.cms

  return {
    route: '/cms/users',

    requireClaims: ['editUser'],

    get: ( req, res ) => {
      store.getP( 'user' )
        .then( users => {
          const items = [{
            require: ['createUser'],
            url: '/cms/users/create',
            title: 'Create User',
            icon: 'plus-circle',
            requireClaims: ['createUser']
          }]

          let userItems = users.filter( item =>
            req.user.claims.includes( 'master' ) || req.user._id === item.creator
          ).map(
            user => {
              return {
                id: user._id,
                url: '/cms/users/' + user._id,
                title: user.email,
                icon: 'user',
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
