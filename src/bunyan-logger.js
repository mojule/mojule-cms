'use strict'
/**
 * @module bunyan-logger
 * Exports Logger with standard Api.  Api maps to bunyan logging functions.
 */

const bunyan = require( 'bunyan' )
const path = require( 'path' )
const utils = require( './utils/utils' )
const stream = require( 'stream' )
const Configurator = require( './configurator' )

const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const levels = [ 'trace', 'debug', 'info', 'warn', 'error', 'fatal' ]

const env = configurator.nodeenv()

const Logger = ( Store, name ) => {
  name = name || 'mojule'

  const store = Store( 'log-' + utils.toIdentifier( name ) )

  const writable = new stream.Writable({
    write: ( chunk, encoding, next ) => {
      const obj = JSON.parse( chunk.toString() )

      obj.key = 'entry-' + utils.toIdentifier( obj.childName || obj.name )

      store.saveP( obj )
        .then(
          () => next()
        )
    }
  })

  const streams = []

  //errors to db in production
  if( env === 'production' ){
    streams.push({
      level: 'error',
      stream: writable
    })
  } else {
    //debug to stdout and db when not in production
    streams.push({
      level: 'debug',
      stream: process.stdout
    })
    streams.push({
      level: 'debug',
      stream: writable
    })
  }

  //always log errors
  streams.push({
    level: 'error',
    path: path.join( __dirname, '..', 'logs', utils.toIdentifier( name ) + '-error.log' )
  })

  const options = { name, streams }

  const log = bunyan.createLogger( options )

  const api = {
    store,
    trace: log.trace.bind( log ),
    debug: log.debug.bind( log ),
    info : log.info.bind( log ),
    warn: log.warn.bind( log ),
    error: log.error.bind( log ),
    fatal: log.fatal.bind( log ),
    child: name => log.child.bind( log )({ childName: name })
  }

  return api
}

module.exports = Logger
