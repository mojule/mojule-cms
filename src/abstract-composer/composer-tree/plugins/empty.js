'use strict'

const emptyPlugin = fn => {
  const empty = ( fn, node ) => {
    const value = fn.value( node )
    return value && value.type && value.type === 'text'
  }

  empty.def = {
    argTypes:   [ 'fn', 'node' ],
    returnType:   'boolean',
    requires:   [ 'value' ],
    categories: [ 'empty', 'plugin' ]
  }

  return Object.assign( fn, { empty } )
} 

module.exports = emptyPlugin
