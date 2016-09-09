'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const pify = require( 'pify' )
const util = require( '../utils/utils' )

const directoriesFromPaths = ( rootPath, fileNames ) =>
  util.promiseFilter( fileNames, fileName => new Promise(
    ( resolve, reject ) => {
      const filePath = path.join( rootPath, fileName )
      fs.stat( filePath, ( err, stats ) => {
        if( err ){
          reject( err )
        } else {
          resolve( stats.isDirectory() )
        }
      })
    }
  ))

const getDirectories = rootPath => new Promise(
  ( resolve, reject ) => {
    fs.readdir( rootPath, ( err, files ) => {
      if( err ){
        reject( err )
      } else {
        resolve( directoriesFromPaths( rootPath, files ) )
      }
    })
  }
)

const getPlugin = ( siteName, pluginName, pluginPath ) => new Promise(
  ( resolve, reject ) => {
    const clientPath = path.join( pluginPath, 'client.js' )
    const serverPath = path.relative( 'src/api', path.join( pluginPath, 'server.js' ) )
    const dataPath = path.relative( 'src/api', path.join( pluginPath, 'data.json' ) )

    fs.readFile( clientPath, 'utf8', ( err, clientJs ) => {
      if( err ){
        reject( err )
      } else {
        resolve({
          site: siteName,
          name: pluginName,
          client: clientJs,
          server: require( serverPath ),
          data: require( dataPath )
        })
      }
    })
  }
)

const getPlugins = ( siteName, sitePath ) =>
  getDirectories( sitePath )
      .then(
        pluginNames => Promise.all(
          pluginNames.map( pluginName => {
            const pluginPath = path.join( sitePath, pluginName )
            return getPlugin( siteName, pluginName, pluginPath )
          })
        )
      )

const getSites = ( rootPath, siteNames ) => Promise.all(
  siteNames.map(
    siteName => {
      const sitePath = path.join( rootPath, siteName )
      return getPlugins( siteName, sitePath )
    }
  )
)

const load = () => new Promise(
  ( resolve, reject ) => {
    const pluginPath = './plugins'

    getDirectories( pluginPath )
      .then(
        siteNames => getSites( pluginPath, siteNames )
      )
      .then(
        plugins => {
          resolve( plugins.reduce( ( result, arr ) =>
            result.concat( arr ), []
          ))
        }
      )
      .catch(
        err => reject( err )
      )
  }
)

const api = {
  load
}

module.exports = api