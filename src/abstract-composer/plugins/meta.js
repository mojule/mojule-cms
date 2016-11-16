'use strict'

const metaPlugin = fn => {
  const metaMap = new Map()
  
  const meta = ( fn, node, key, value ) => {
    if( !metaMap.has( node ) ){
      metaMap.set( node, {} )
    }

    const obj = metaMap.get( node )

    if( value !== undefined ){
      obj[ key ] = value
    }

    return obj[ key ]
  }  

  meta.def = {
    argTypes:   [ 'fn', 'node', 'string', 'any' ],
    returnType:   'any',
    requires:   [],
    categories: [ 'meta', 'plugin' ]    
  }

  return Object.assign( fn, { meta } )
} 

module.exports = metaPlugin
