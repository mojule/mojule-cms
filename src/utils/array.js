'use strict'

const arrayUtils = {
  unique: arr =>
    arr.filter( ( el, i ) => arr.indexOf( el ) === i ),

  sortBy: mapper => ( a, b ) => {
    a = mapper( a )
    b = mapper( b )

    if( a > b ) return 1
    if( a < b ) return -1
    return 0
  }
}

module.exports = arrayUtils
