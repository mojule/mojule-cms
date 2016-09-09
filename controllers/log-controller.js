'use strict'

const path = require( 'path' )
const UiModel = require( '../models/ui-model' )
const claims = require( '../src/claims' )
const utils = require( '../src/utils/utils' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  const getLogs = () =>
    app.deps.logger.store.allP()
      .then( entries => {
        const names = utils.unique(
          entries.map(
            entry =>
              entry.childName || entry.name
          )
        )

        return names.map(
          name => {
            return {
              name,
              key: 'entry-' + utils.toIdentifier( name )
            }
          }
        )
      })

  return {
    route: '/cms/logs',

    requireClaims: ['master'],

    get: ( req, res ) => {
      getLogs()
      .then( logs => {
        const clearAllItem = {
          url: '/cms/logs/clear',
          icon: 'trash',
          title: 'Clear All',
          requireClaims: ['master']
        }

        const items = claims.filterByClaims(
          logs.map(
            log => ( {
              url: '/cms/logs/' + log.key,
              icon: 'book',
              title: log.name,
              requireClaims: ['master']
            })
          ),
          req.user.claims
        )

        const model = Object.assign(
          {
            title: 'mojule',
            icon: 'book',
            subtitle: 'Logs',
            user: {
              email: req.user.email,
              id: req.user._id
            },
            library: {
              size: 5,
              items: [clearAllItem].concat( items )
            }
          },
          new UiModel( req.session.currentSite )
        )

        res.render( 'ui-home', model )
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
