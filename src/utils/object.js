'use strict'

const deepAssign = require( './deep-assign' )

const objectUtils = {
  clone: obj => Object.assign( {}, obj ),
    /**
     * @function deepClone -
     * @returns - clone of js object. Propeties only. All functions etc stripped out.
     * @param obj - object to clone
     */
  deepClone: obj =>
    JSON.parse( JSON.stringify( obj ) ),

  //returns the object's values as an array, while adding a key property to each value
  //note that adding the key is destructive in that it adds it to the original object
  //the toolbars actually rely on this!
  arrayify: obj => Object.keys( obj ).map( key =>
    Object.assign( obj[ key ], { key } )
  ),

  deepAssign
}

module.exports = objectUtils
