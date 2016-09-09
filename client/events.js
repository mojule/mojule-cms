'use strict'

const Events = () => {
  const subs = {}

  const events = {
    on: ( key, listener ) => {
      if( !Array.isArray( subs[ key ] ) )
        subs[ key ] = []

      const index = subs[ key ].push( listener ) - 1

      return () => delete subs[ key ][ index ]
    },
    emit: ( key, data ) => {
      if( Array.isArray( subs[ key ] ) )
        subs[ key ].filter( l => l ).forEach( listener => listener( data ) )
    }
  }

  return events
}

module.exports = Events
