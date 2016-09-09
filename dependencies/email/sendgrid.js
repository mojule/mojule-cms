'use strict'

const path = require( 'path' )
const Configurator = require( '../../src/configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const sendgridKey = configurator.sendgrid().apikey

const sendgrid = require( 'sendgrid' )( sendgridKey )

module.exports = sendgrid
