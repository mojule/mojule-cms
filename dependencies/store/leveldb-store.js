'use strict'
/**
 * @module leveldb-store - levelDb implementation of store interface
 */
const level = require( 'levelup' )
const DbItem = require( '../../src/db/db-item' )

/**
 * @const storeCache -in node a module is treated as a singleton
 * - we store a cache of the already open stores to prevent trying to open an already
 * - open store, as if it is already open it is locked and will throw an error on
 * - trying to open it again
 */
const storeCache = {}

/**
 * @function load - loads items(s) from passed db
 * @returns - dbitem instance(s).
 * @param db - levelDb instance.
 * @param arg - single id or array of ids
 */
const load = ( db, arg ) => {
  if( Array.isArray( arg ) ){
      // note recursive call when arg is array of item ids
    return Promise.all( arg.map( id => load( db, id ) ) )
  } else {
    return new Promise(
      ( resolve, reject ) => {
        db.get( arg, ( err, item ) => {
          if( err ){
            reject( err )
          } else {
            resolve( JSON.parse( item ) )
          }
        })
      }
    )
  }
}

/**
 * @function exists - returns true if item with id exists in store
 * @returns - true/false
 * @param db - levelDb instance
 * @param id - id to test if exists
 */
const exists = ( db, id ) => new Promise(
  resolve => {
    load( db, id )
      .then(
        () => resolve( true )
      )
      .catch(
        err => resolve( false )
      )
  }
)

/**
 * @function save - saves an object/dbitem in levelDb
 * @returns - dbItem with clones properties of passed obj/dbItem.
 * - _created/_updated properties are set to current date.
 * @param db - levelDb instance
 * @param onSave - called back on save
 * @param obj - object to save. May be obj or dbItem.
 * @param preventSaveCb - true to prevent onSave call.
 */
const save = ( db, onSave, obj, preventSaveCb ) => new Promise(
  ( resolve, reject ) => {
    const item = DbItem( obj )

    exists( db, item._id )
      .then(
        isExisting => {
          const now = (new Date()).toJSON()

          if( !isExisting ){
            item._created = now
          }

          item._updated = now

          db.put( item._id, JSON.stringify( item ), ( err ) => {
            if( err ){
              reject( err )
            } else {
              if( onSave && !preventSaveCb ){
                onSave( item )
              }

              resolve( item )
            }
          })
        }
      )
  }
)

const get = ( db, type ) => new Promise(
  ( resolve, reject ) => {
    const items = []

    db.createReadStream({
      start: type + '-' ,
      end: type + '-\uffff'
    }).on( 'data', item => {
      items.push( JSON.parse( item.value ) )
    }).on( 'error', err => {
      reject( err )
    }).on( 'close', () => {
      resolve( items )
    })
  }
)

const remove = ( db, id ) => new Promise(
  ( resolve, reject ) => {
    db.del( id, err => {
      if( err ){
        reject( err )
      } else {
        resolve( 1 )
      }
    })
  }
)

const all = db => new Promise(
  ( resolve, reject ) => {
    const items = []

    db.createReadStream(
    ).on( 'data', item => {
      items.push( JSON.parse( item.value ) )
    }).on( 'error', err => {
      reject( err )
    }).on( 'close', () => {
      resolve( items )
    })
  }
)

//indices not used but retained for api compatibility
const LevelDbStore = ( name, indices, onSave ) => {
  if( name in storeCache ){
    return Object.assign( storeCache[ name ], { onSave } )
  }

  const db = level( './data/level/' + name )

  const api = {
    onSave,

    saveP: ( obj, preventSaveCb ) => save( db, onSave, obj, preventSaveCb ),

    getP: type => get( db, type ),

    loadP: arg => load( db, arg ),

    removeP: id => remove( db, id ),

    allP: () => all( db )
  }

  storeCache[ name ] = api

  return api
}

const storeExists = ( name, callback ) => {
  if( Object.keys( storeCache ).includes( name ) ){
    callback( true )
  } else {
    const options = {
      errorIfExists: true
    }

    const levelDb = level( './data/level/' + name, options, err => {
      //if err is truthy, it already exists
      const alreadyExists = !!err

      if( levelDb.isOpen()){
        levelDb.close( () => {
          callback( alreadyExists )
        })
      } else {
        callback( alreadyExists )
      }
    })
  }
}

LevelDbStore.exists = name => new Promise(
  resolve => {
    storeExists( name, exists => {
      resolve( exists )
    })
  }
)

module.exports = LevelDbStore
