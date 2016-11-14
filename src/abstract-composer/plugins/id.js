'use strict'

const utils = require( '../utils' )

const idPlugin = fn => {
  const id = ( fn, node ) => {
    const value = fn.value( node )
    
    let nodeType = value.nodeType

    if( typeof nodeType !== 'string' ) nodeType = value.type
    if( typeof nodeType !== 'string' ) nodeType = 'node'

    if( !value._id ){
      value._id = utils.randomId( nodeType )
      fn.value( node, value )
    }

    return value._id
  }  

  id.def = {
    argTypes:   [ 'fn', 'node' ],
    returnType:   'string',
    requires:   [ 'value' ],
    categories: [ 'id', 'plugin' ]    
  }

  return Object.assign( fn, { id } )
} 

module.exports = idPlugin
