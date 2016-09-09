'use strict'

const validator = require( './validator' )

const isReference = obj => validator.validate( obj, 'reference' )
const isTags = obj => validator.validate( obj, 'tags' )

const Assemble = ( schema, body ) =>
  ObjectNode( schema.id, schema, body )

const ObjectNode = ( path, node, body ) => {
  const obj = Object.keys( node.properties ).reduce( ( obj, key ) => {
    const childPath = [ path, key ].join( '.' )
    const child = node.properties[ key ]

    obj[ key ] = Node( childPath, child, body )

    return obj
  }, {})

  return obj
}

const Node = ( path, node, body ) => {
  if( !node.type && node.$ref ){
    return handlers.$ref( path, node, body )
  }

  return handlers[ node.type ]( path, node, body )
}

const StringNode = ( path, node, body ) =>
  body[ path ]

const ArrayNode = ( path, node, body ) => {
  if( !Array.isArray( body[ path ] ) ) return []

  if( node.items.$ref === 'reference' && node.format === 'checklist' ){
    return body[ path ].map( id =>
      node.items.enum.find( item => item._id === id )
    )
  } else {
    return body[ path ].filter( el => el !== '' )
  }
}

const BooleanNode = ( path, node, body ) =>
  ( path in body )

const IntegerNode = ( path, node, body ) =>
  Number( body[ path ] )

const ReferenceNode = ( path, node, body ) => {
  if( node.$ref === 'reference' ){
    return node.enum.find( item => item._id === body[ path ] )
  } else if( node.$ref === 'tags' ){
    return body[ path ]
  }
}


const handlers = {
  array: ArrayNode,
  boolean: BooleanNode,
  integer: IntegerNode,
  number: IntegerNode,
  object: ObjectNode,
  string: StringNode,
  $ref: ReferenceNode
}

module.exports = Assemble
