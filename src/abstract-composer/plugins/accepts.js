'use strict'

const acceptsPlugin = fn => {
  const accepts = ( fn, node, childNode ) => !fn.empty( fn, node )  

  accepts.def = {
    argTypes:   [ 'fn', 'node', 'node' ],
    returnType:   'boolean',
    requires:   [ 'empty' ],
    categories: [ 'accepts', 'plugin' ]    
  }

  return Object.assign( fn, { accepts } )
} 

module.exports = acceptsPlugin
