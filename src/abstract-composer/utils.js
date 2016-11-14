'use strict'

const utils = {
  randomHex: length => {
    let str = ''

    for( let i = 0; i < length; i++ ){
      str += Math.floor( Math.random() * 16 ).toString( 16 )
    }

    return str
  },

  randomId: prefix =>
    ( prefix ? prefix + '-' : '' ) +
    utils.randomHex( 32 )
}

module.exports = utils
