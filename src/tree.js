'use strict'

const Tree = root => {
  const walk = ( node, callback, depth ) => {
    if( typeof node === 'function' ){
      depth = callback
      callback = node
      node = root
    }

    depth = depth || 0

    callback( node, depth )

    if( Array.isArray( node.children )){
      node.children.forEach( child => {
        walk( child, callback, depth + 1 )
      })
    }
  }

  const find = predicate => {
    let target

    walk( root, n => {
      if( typeof target === 'undefined' && predicate( n ) )
        target = n
    })

    return target
  }

  const findAll = predicate => {
    const nodes = []

    walk( root, n => {
      if( predicate( n ) ) nodes.push( n )
    })

    return nodes
  }

  const parent = node => {
    return find( n => Array.isArray( n.children ) && n.children.includes( node ) )
  }

  const api = {
    //find everywhere using utils.walk and replace with this
    walk,
    find,
    findAll,
    parent
  }

  return api
}

module.exports = Tree
