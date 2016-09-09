'use strict'

const emailer = {
  Email: function( email ){
    Object.assign( this, email )    
  },
  send: ( email, callback ) => {
    emailer.outbox.push( email )
    callback( null, {} )
  },
  outbox: []
}

module.exports = emailer
