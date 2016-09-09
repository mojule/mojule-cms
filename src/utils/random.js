'use strict'

const stringUtil = require( './string' )

/**
 * @const random - Random hex string and id functions.
 */
const randomUtils = {
  randomHex: length => {
    let str = ''

    for( let i = 0; i < length; i++ ){
      str += Math.floor( Math.random() * 16 ).toString( 16 )
    }

    return str
  },

  /**
   * @function randomId - prepends a string of 32 hex digits with passed prefix. Mostly used for store id generation.
   * @returns - .
   */
  randomId: prefix =>
    ( stringUtil.isIdentifier( prefix ) ? String( prefix ) + '-' : '' ) +
    randomUtils.randomHex( 32 )
}

module.exports = randomUtils
