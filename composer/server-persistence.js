module.exports = ( site, store, session ) => {
  const storeApi = require( '../src/api/store-api' )( site, store, session )
  
  return {
    save: ( obj, callback ) => {   
      storeApi.save( obj )
        .then(
          obj => callback( null, obj )
        )
        .catch(
          err => callback( err )
        )
    },
    load: ( id, callback ) => {
      storeApi.load( id )
        .then(
          obj => callback( null, obj )
        )
        .catch(
          err => callback( err )
        )
    },
    get: function( key, callback ){
      storeApi.get( key )
        .then(
          items => {
            callback( null, items )
          }
        )
        .catch(
          err => {
            callback( err )
          }
        )
    }
  }
}
