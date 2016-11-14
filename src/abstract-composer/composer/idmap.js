'use strict'

const IdMap = tree => {
  const idMap = new Map()

  const findById = id => {
    if( idMap.has( id ) ) return idMap.get( id )

    const node = tree.find( n => n.id() === id )

    idMap.set( id, node )

    return node
  }

  const refresh = node => {
    node.walk( n => idMap.set( n.id(), n ) )  
  }

  refresh( tree )

  return Object.assign( idMap, { findById, refresh } )
}

module.exports = IdMap
