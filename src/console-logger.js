'use strict'
/**
 * @module console-logger
 * Exports Logger with standard Api.  This logger for testing only. No permanent logs written.
 * @see bunyan-logger
 */

const bunyan = require( 'bunyan' )

const Logger = ( name ) => {
  name = name || 'mojule'


  const options = {
    name,
    streams: [
      {
        level: 'debug',
        stream: process.stdout
      }
    ]
  }

  const log = bunyan.createLogger( options )

  const api = {
    store: () => { throw new Error("store is not defined in console logger")},
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
