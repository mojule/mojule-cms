const fs = require( 'fs' )
const pify = require( 'pify' )

const restorePath = 'uploads/cmsRestore.zip'

const restoreExists = () => new Promise(
  resolve => fs.exists( restorePath, resolve )
)

const unlink = pify( fs.unlink )

const init = cmsApi => new Promise(
  ( resolve, reject ) => {
    restoreExists()
      .then( exists => {
        if( exists )
          return cmsApi.createFromBackup( restorePath )
            .then( () => unlink( restorePath ) )
      })
      .then( () => resolve() )
      .catch( reject )
  }
)

module.exports = init
