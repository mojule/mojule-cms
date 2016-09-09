'use strict'

const mergePair = ( target, src ) => {
  const isArray = Array.isArray( src )
  
  let dest = isArray ? [] : {}
  
  if( isArray ){
    target = target || []
    dest = dest.concat( target )
    
    src.forEach( ( item, i ) => {
      if( typeof dest[ i ] === 'undefined' ){
        dest[ i ] = item
      } else if( typeof item === 'object' ){
        dest[ i ] = mergePair( target[ i ], item )
      } else if( target.indexOf( item ) === -1 ){
        dest.push( item )        
      }
    })
  } else {
    if( target && typeof target === 'object' ){
      Object.keys( target ).forEach( key => {
        dest[ key ] = target[ key ]
      })
    }
    
    Object.keys( src ).forEach( key => {
      if( typeof src[ key ] !== 'object' || !src[ key ] || !target[ key ] ){
        dest[ key ] = src[ key ]
      } else {
        dest[ key ] = mergePair( target[ key ], src[ key ] )
      }
    })
  }
  
  return dest
}

/**
 * @function deepAssign - Extended Object.assign to allow assignment to nested objects. 
 * @returns - object "deeply" extended with properties of argments.
 * @param arguments - unspecified set of arguments.
 * @example - call utils.deepAssign( target, a, b, c)
 */
const deepAssign = function() {
    // Note arguments are not available in lambda until spread operator is supported hence function() syntax.
    // arguments is globally scoped 
  const objects = Array.from( arguments )
  return objects.reduce( ( result, obj ) =>
    mergePair( result, obj ),
    {}
  )
}
  
module.exports = deepAssign