'use strict'

const graph = {
    /**
     * @function walk - traverses all nodes in a tree applying callback.
     */
  walk: ( node, callback ) => {
    callback( node )

    if( Array.isArray( node.children )){
      node.children.forEach( child => {
        graph.walk( child, callback )
      })
    }
  }
}

module.exports = graph