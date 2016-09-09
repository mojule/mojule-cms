'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/logs/clear/:key?',

    requireClaims: ['master'],

    get: ( req, res ) => {
      const key = req.params.key

      if ( key ) {
        app.deps.logger.store.getP( key )
          .then( items => Promise.all( items.map( item => app.deps.logger.store.removeP( item._id ) ) ) )
          .then(() => res.redirect( '/cms/logs/' + key ) )

        return
      }

      app.deps.logger.store.allP()
        .then( items => Promise.all( items.map( item => app.deps.logger.store.removeP( item._id ) ) ) )
        .then(() => res.redirect( '/cms/logs/' ) )
    }
  }
}
