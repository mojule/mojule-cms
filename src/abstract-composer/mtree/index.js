'use strict'

// temporary to make it easier to create tree adapters - change 1tree api!

const Tree = require( '1tree' )
const defaultAdapter = require( '1tree/dist/adapter/default' )

const basePlugins = Object.keys( Tree.plugins ).map( key => Tree.plugins[ key ] )

const Mtree = ( ...args ) => {
  const excludeBase = args.some( arg => typeof arg === 'boolean' && arg )

  let adapter = defaultAdapter
  let plugins = excludeBase ? [] : basePlugins

  args.forEach( arg => {    
    if( Array.isArray( arg ) ){
      plugins = arg.concat( plugins )
    } else if( typeof arg === 'function' ){
      plugins = [ arg ].concat( plugins )
    } else if( typeof arg === 'object' ) {
      adapter = arg
    } 
  })

  return Tree.adapter( adapter, plugins )
}

module.exports = Mtree
