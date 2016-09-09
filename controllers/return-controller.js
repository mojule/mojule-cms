'use strict'

const path = require( 'path' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/return',

    get: ( req, res ) => {
      if( req.session.returnPath ){
        res.redirect( req.session.returnPath )
        delete req.session.returnPath

        return
      }

      res.redirect( '/cms' )
    }
  }
}
