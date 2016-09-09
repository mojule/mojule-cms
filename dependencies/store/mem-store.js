'use strict'
/**
 * @module mem-store - memory store implementation of store interface
 */

const DbItem = require( '../../src/db/db-item' )
const utils = require( '../../src/utils/utils' )

const exists = ( data, id ) => data[ id ] !== undefined

const save = ( data, obj ) => {
  const item = DbItem( utils.deepClone( obj ) )

  const now = (new Date()).toJSON()

  if( !exists( data, item._id ) ){
    item._created = now
  }

  item._updated = now

  data[ item._id ] = item

  return Promise.resolve( item )
}

const load = ( data, id ) => {
  if( Array.isArray( id ) ){
    return Promise.all( id.map( id => load( data, id ) ) )
  } else {
    return Promise.resolve( data[ id ] || Promise.reject( new Error( 'No item found with key ' + id ) ) )
  }
}

const get = ( data, key ) => {
  const items = Object.keys( data ).reduce( ( found, id ) => {
    const item = data[ id ]

    if( item.key === key ){
      found.push( item )
    }

    return found
  }, [] )

  return Promise.resolve( items )
}

const remove = ( data, id ) => {
  if( Object.keys( data ).includes( id ) ){
    delete data[ id ]
    return Promise.resolve( 1 )
  } else {
    return Promise.resolve( 0 )
  }
}

const all = data =>
  Promise.resolve( Object.keys( data ).map( key => data[ key ] ) )

const Api = data => ({
  saveP: obj => save( data, obj ),
  loadP: id => load( data, id ),
  getP: key => get( data, key ),
  removeP: id => remove( data, id ),
  allP: () => all( data )
})

/**
 * @function SessionMemStoreFactory - The basic mem-store above cannot be used for testing complex apis as these require the store session to preserve state from call to call.
 * - sessionMemStore
 * @returns - a sessionMemStore.
 */
const SessionMemStoreFactory = () => {
  const storesData = {}
  const memStores = {}

  const getData = name => {
    if( !( name in storesData ) ){
      storesData[ name ] = {}
    }

    return storesData[ name ]
  }

  const MemStore = name => {
    const data = getData( name )

    memStores[ name ] = Api( data )

    return memStores[ name ]
  }

  MemStore.exists = name => Promise.resolve( name in memStores )
  MemStore.stores = memStores

  return MemStore
}

const MemStore = name => Api({})

MemStore.Session = SessionMemStoreFactory
MemStore.exists = name => Promise.resolve( true )

module.exports = MemStore
