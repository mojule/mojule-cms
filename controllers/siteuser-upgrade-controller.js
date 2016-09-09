'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const emailer = require( '../src/email' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const UserApi = require( '../src/api/user-api' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/siteusers/upgrade/:id',

    requireClaims: ['editUser'],

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

      const site = req.session.currentSite

      let siteStore

      const userApi = UserApi( app.deps.stores.cms, emailer )

      siteApi.getStore( app.deps.stores, site )
        .then( store => {
          siteStore = store
        })
        .then( () => siteStore.loadP( id ) )
        .then( user => userApi.siteToCmsUser( app.deps.stores.cms, siteStore, req.user, user  ) )
        .then( user => {
          res.redirect( '/cms/users/' + user._id )
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
