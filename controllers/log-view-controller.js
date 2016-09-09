'use strict'

const path = require( 'path' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const claims = require( '../src/claims' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/logs/:key',

    requireClaims: ['master'],

    get: ( req, res ) => {
      const key = req.params.key

      app.deps.logger.store.getP( key )
        .then( all => {
          const deleteItem = {
            url: '/cms/logs/clear/' + key,
            icon: 'trash',
            title: 'Clear Log',
            requireClaims: ['master']
          }

          const entries = all.map( entry => ( {
            key: entry.msg,
            time: entry.time,
            message: JSON.stringify( entry.message || entry.err || entry, null, 2 )
          }) ).sort(( a, b ) => new Date( b.time ) - new Date( a.time ) )

          let subtitle = key

          if ( all.length > 0 ) {
            subtitle = all[0].childName || all[0].name
          }

          const model = Object.assign(
            {
              title: 'mojule',
              icon: 'book',
              subtitle,
              user: {
                email: req.user.email,
                id: req.user._id
              },
              entries,
              library: {
                size: 5,
                items: [deleteItem]
              }
            },
            new UiModel( req.session.currentSite )
          )

          res.render( 'ui-log', model )
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
