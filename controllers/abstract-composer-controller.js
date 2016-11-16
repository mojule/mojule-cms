'use strict'

const path = require( 'path' )
const fs = require( 'fs' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms/abstract-composer',

    get: ( req, res ) => {
      const fullPath = path.resolve( __dirname, '..', './views/abstract-composer.html' )
      res.sendFile( fullPath )
    }
  }
}
