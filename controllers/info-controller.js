'use strict'

const UiModel = require( '../models/ui-model' )
const path = require( 'path' )
const Configurator = require( '../src/configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/info',

    requireClaims: ['master'],

    get: ( req, res ) => {
      const kvps = [
        {
          key: 'NODE_ENV',
          value: app.settings.env
        }
      ]

      Object.keys( configurator ).forEach( name => {
        const result = configurator[ name ]()

        if( result == undefined || typeof result === 'string' ){
          kvps.push({
            key: 'Configurator ' + name,
            value: result
          })
        } else {
          Object.keys( result ).forEach( prop => {
            kvps.push({
              key: 'Configurator ' + name + ' ' + prop,
              value: result[ prop ]
            })
          })
        }
      })

      const model = Object.assign(
        {
          title: 'mojule',
          icon: 'info',
          subtitle: 'Info',
          user: {
            email: req.user.email,
            id: req.user._id
          },
          kvps
        },
        new UiModel( req.session.currentSite )
      )

      res.render( 'ui-info', model )
    }
  }
}
