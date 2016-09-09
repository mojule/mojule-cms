'use strict'

const yazl = require( 'yazl' )

const create = () => Promise.resolve( new yazl.ZipFile() )

const close = zip => {
  zip.end()
  
  return Promise.resolve( zip )
}

const addString = ( zip, str, filename ) => {
  zip.addBuffer( new Buffer( str ), filename )
  
  return Promise.resolve( zip )  
}

const addObject = ( zip, obj, filename ) => {
  const json = JSON.stringify( obj, null, 2 )
  
  return addString( zip, json, filename )
}

const addFiles = ( zip, paths ) => {
  paths
    .map( filePath => filePath.replace( /\\/g, '/' ) )
    .forEach( posixPath => zip.addFile( posixPath, posixPath ))
    
  return Promise.resolve( zip )
}

const zipFiles = paths => 
  create()
    .then(
      zip => addFiles( zip, paths )
    )
    .then(
      close
    )


const zipper = {
  zipFiles,
  addFiles,
  addString,
  addObject,
  create,
  close
}

module.exports = zipper
