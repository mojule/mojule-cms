'use strict'

module.exports = ( app, passport ) => {
  return {
    route: '/cms/logout',

    get: ( req, res ) => {
      req.logout()

      const referer = req.header( 'Referer' )

      if( referer ){
        res.redirect( referer )
      } else {
        res.redirect( '/' )
      }
    }
  }
}
