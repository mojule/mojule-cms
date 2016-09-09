'use strict'

/**
 * @function storeCopy - copies all the items from store to store. 
 * - applies to cms and site stores  
 * @returns - toStore populated with items in fromStore
 * @param fromStore - copy from this store
 * @param toStore - copy to this store
 */
const storeCopy = ( fromStore, toStore ) =>
  new Promise(
    ( resolve, reject ) => {
      fromStore.allP()
        .then(
          items => 
            Promise.all( items.map( item => toStore.saveP( item, true ) ))
        ).then(
          items => 
            resolve( items )
        ).catch(
          err => 
            reject( err )
        )
    }
  ) 
  
module.exports = storeCopy
 