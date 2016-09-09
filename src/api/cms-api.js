'use strict'
/**
 * @module cms-api.js - Operations pertaining to the entire cms not a single site.
 * - e.g. Backing up all the sites.
 */

const fs = require( 'fs' )
const path = require( 'path' )
const zipper = require( '../zipper' )
const yauzl = require( 'yauzl' )
const util = require( '../utils/utils' )

const openZip = filePath => new Promise(
  ( resolve, reject ) => {
    yauzl.open( filePath, { lazyEntries: true }, ( err, zipfile ) => {
      if ( err ) {
        reject( err )
      } else {
        resolve( zipfile )
      }
    })
  }
)

const saveSite = ( siteApi, stores, site, logger ) => {
  const cmsStore = stores.cms
  const items = site.items

  delete site.items

  return cmsStore.saveP( site )
    .then( site =>
      logger.info( { message: { 'Saved Site to DB': site.name } }, 'restoreSite' )
    )
    .then( () => siteApi.getStore( stores, site ) )
    .then( siteStore =>
      Promise.all(
        items.map( item => siteStore.saveP( item ) )
      )
    )
    .then( savedItems => {
      logger.info( { message: { 'Items Added to DB': savedItems.length } }, 'restoreSite' )

      return savedItems
    })
}

const processEntry = ( siteApi, stores, zipfile, entry, reject, logger ) => {
  logger.info( { message: { processEntry: entry.fileName } }, 'restoreSite' )

  // directory file names end with '/'
  if ( /\/$/.test( entry.fileName ) ) {
    logger.info( { message: { 'Rejected (empty folder)': entry.fileName } }, 'restoreSite' )
    zipfile.readEntry()
    return
  }

  zipfile.openReadStream( entry, ( err, readStream ) => {
    if ( err ) {
      reject( err )
      return
    }

    const parsed = path.parse( entry.fileName )

    if ( parsed.base === 'site.json' ) {
      logger.info( { message: 'Processing site.json' }, 'restoreSite' )

      readStream.setEncoding( 'utf8' )

      const chunks = []

      readStream.on( 'data', chunk => {
        chunks.push( chunk )
      })

      readStream.on( 'end', () => {
        const siteJson = chunks.join( '' )
        const site = JSON.parse( siteJson )

        saveSite( siteApi, stores, site, logger )
          .then( () => {
            zipfile.readEntry()
          })
          .catch( err => {
            reject( err )
            zipfile.close()
          })
      })
    } else if ( parsed.dir.indexOf( 'data/files' ) === 0 ) {
      fs.exists( parsed.dir, exists => {
        if ( !exists ) {
          fs.mkdirSync( parsed.dir )
        }

        readStream.on( 'end', () => {
          zipfile.readEntry()
        })

        const writeStream = fs.createWriteStream( entry.fileName )

        readStream.pipe( writeStream )

        logger.info( { message: { 'File Extracted': entry.fileName } }, 'restoreSite' )
      })
    } else {
      logger.info( { message: { 'Unhandled file': parsed.base } }, 'restoreSite' )
      readStream.end()
      zipfile.readEntry()
    }
  })
}

const getSitesData = ( siteApi, stores, items ) =>
  Promise.all(
    items.map(
      item => {
        if ( item.key === 'site' ) {
          return siteApi.siteData( stores, item )
        } else {
          return Promise.resolve( item )
        }
      }
    )
  )

const addSitesFiles = ( siteApi, stores, items, zip ) =>
  Promise.all( items.map( item => {
    if ( item.key === 'site' ) {
      return siteApi.filePaths( stores, item )
        .then( files => zipper.addFiles( zip, files ) )
    } else {
      return Promise.resolve()
    }
  }))

const cmsData = ( siteApi, stores ) =>
  stores.cms.allP()
    .then( items => getSitesData( siteApi, stores, items ) )

const backup = ( siteApi, stores ) => {
  let zip
  const onCreateZip = z => zip = z

  return zipper.create()
    .then( onCreateZip )
    .then( () => cmsData( siteApi, stores ) )
    .then( items =>
      zipper.addObject( zip, items, 'cms.json' )
        .then( () => items )
    )
    .then( items => addSitesFiles( siteApi, stores, items, zip ) )
    .then( () => zipper.close( zip ) )
}

const restoreSite = ( siteApi, stores, zipPath, logger ) =>
  openZip( zipPath )
    .then( zipfile => {
      logger.info( { message: 'Opened zip at ' + zipPath }, 'restoreSite' )

      return zipfile
    })
    .then( zipfile => new Promise(
      ( resolve, reject ) => {
        zipfile.on( 'entry', entry => {
          processEntry( siteApi, stores, zipfile, entry, reject, logger )
        })
        zipfile.on( 'close', () => {
          resolve()
        })
        zipfile.readEntry()
      }
    ))
    .then( () => {
      logger.info( { message: 'Zip closed' }, 'restoreSite' )
    })

const CmsApi = ( Store, deps, session ) => {
  const cmsStore = deps.stores.cms
  const siteApi = require( './site-api' )( Store, deps, session )
  const logger = deps.logger.child( '/src/api/cms-api' )

  const api = {
    backup: () => backup( siteApi, deps.stores ),
    restoreSite: zipPath => restoreSite( siteApi, deps.stores, zipPath, logger )
  }

  return api
}

module.exports = CmsApi
