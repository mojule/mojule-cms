'use strict'
/**
 * @module nedb-store - nedb implementation of store interface  
 */

const Datastore = require( 'nedb' )
const fs = require( 'fs' )
const DbItem = require( '../db/db-item' )
const utils = require( '../utils/utils' )

const exists = ( db, id ) => new Promise(
  ( resolve, reject ) => {
    db.count({ _id: id }, ( err, count ) => {
      if( err ){
        reject( err )
      } else {
        resolve( count !== 0 )
      }
    })    
  }
)

const save = ( db, onSave, obj, preventSaveCb ) => {
  const item = DbItem( utils.deepClone( obj ) )
  
  return exists( db, item._id )
    .then(
      isExisting => {
        const now = (new Date()).toJSON()
        
        if( !isExisting ){
          item._created = now
        }
        
        item._updated = now
      }
    )
    .then(
      () => new Promise(
        ( resolve, reject ) => {
          db.update({ _id: item._id }, item, { upsert: true }, ( err, numReplaced, newDoc ) => {
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
    )
}

const load = ( db, arg ) => {
  if( Array.isArray( arg ) ){
    return Promise.all( arg.map( id => load( db, id ) ) )
  }    
  
  return new Promise(
    ( resolve, reject ) => {
      db.findOne({ _id: arg }, ( err, item ) => {
        if( err ){
          reject( err )
        } else if( item ) {
          resolve( item )
        } else {
          reject( new Error( 'No item found with key ' + arg ) )
        }
      })
    }
  )
} 

const get = ( db, key ) => new Promise(
  ( resolve, reject ) => {
    db.find({ key: key }, ( err, item ) => {
      if( err ){
        reject( err )
      } else {
        resolve( item )
      }
    })
  }
)

const remove = ( db, id ) => new Promise(
  ( resolve, reject ) => {
    db.remove({ _id: id }, {}, ( err, count ) => {
      if( err ){
        reject( err )
      } else {
        resolve( count )
      }                
    })
  }
)    

const all = db => new Promise(
  ( resolve, reject ) => {
    db.find( {}, ( err, docs ) => {
      if( err ){
        reject( err )
      } else {
        resolve( docs )
      }
    })
  }
)

const NedbStore = ( name, indices, onSave ) => {
  const db = new Datastore({
    filename: 'data/' + name + '.db',
    autoload: true
  })
  
  db.ensureIndex({ fieldName: 'key' }, err => {
    if( err ) throw err
  })  
      
  if( Array.isArray( indices ) ){
    indices.forEach( index =>
      db.ensureIndex({ fieldName: index }, err => {
        if( err ) throw err 
      })
    )
  }
      
  const store = {
    saveP: ( obj, preventSaveCb ) => save( db, onSave, obj, preventSaveCb ),
    loadP: arg => load( db, arg ),
    getP: key => get( db, key ),
    removeP: id => remove( db, id ),
    allP: () => all( db )
  }
  
  return store
}

NedbStore.exists = name => new Promise(
  resolve => fs.exists( 'data/' + name + '.db', resolve )
)

module.exports = NedbStore
