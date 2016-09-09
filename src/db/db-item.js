'use strict'

const utils = require( '../utils/utils' )

/**
 * @function dbItem - clones the passed obj ensuring has properties required for db storing etc.
 * @returns - cloned obj with ensured key and _id properties.
 * @param obj - object to be cloned
 * @param type - optional type for object
 */
const dbItem = ( obj, type ) => {
  // key is existing key or passed type or passed obj type i.e. String, Boolean etc
  let key = obj.key || type || typeof obj
  let _id

  if( utils.isIdentifier( obj._id ) ){
    _id = obj._id
    // hack for backward compatibility with old data
  } else if( utils.isIdentifier( obj.id ) ){
    _id = obj.id
  } else {
    _id = utils.randomId( key )
  }

  return Object.assign( {}, obj, {
    key,
    _id
  })
}

module.exports = dbItem
