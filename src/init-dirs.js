'use strict'

const pify = require( 'pify' )
const mkdirp = pify( require( 'mkdirp' ) )
const fs = require( 'fs' )

const directories = [
  'data/files',
  'cache',
  'uploads',
  'test/fixtures/data/files',
  'test/fixtures/cache',
  'test/fixtures/uploads'
]

const makeDir = directoryName => new Promise(
  resolve => {
    fs.exists( directoryName, exists => {
      if( !exists ){
        mkdirp( directoryName )
          .then(
            () => resolve()
          )
      } else {
        resolve()
      }       
    })
  }
)

const initDirectories = () => Promise.all( directories.map( makeDir ) )

module.exports = initDirectories
