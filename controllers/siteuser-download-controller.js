'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const emailer = require( '../src/email' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )
const objectsToCsv = require( '../src/objecttocsv' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/siteusers/csv',

    requireClaims: ['editUser'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const site = req.session.currentSite

      siteApi.getStore( app.deps.stores, site )
        .then( store => store.getP( 'user' ) )
        .then(
          users => {
            const exclude = [ 'salt', 'password', 'sites', 'claims', 'key', '_id', 'creator', 'currentSite', 'isSiteUser' ]

            const csv = objectsToCsv( users, exclude, true )

            res.set( 'Content-Type', 'text/csv' )
            res.set( 'Content-disposition', 'attachment; filename=siteusers.csv' )

            res.send( csv )
          }
        )
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
