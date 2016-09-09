'use strict'

const fs = require( 'fs' )
const crypto = require( 'crypto' )
const path = require( 'path' )

const pify = require( 'pify' )
const yauzl = require( 'yauzl' )
const mime = require( 'mime' )
const utils = require( '../utils/utils' )

const dbItem = require( '../db/db-item' )

const Configurator = require( '../configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const presizeImages = configurator.imageResize().presize

const mimeToIcon = {
  'text/plain' : 'file-text-o',
  'application/pdf': 'file-pdf-o',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file-word-o',
  'application/msword': 'file-word-o',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file-excel-o',
  'application/vnd.ms-excel': 'file-excel-o',
  'application/x-zip': 'file-zip-o',
  'application/zip': 'file-zip-o',
  'text/css': 'file-code-o',
  'text/html': 'file-code-o',
  'application/javascript': 'file-code-o',
  'application/xml': 'file-code-o',
  'image/svg+xml': 'picture-o',
  'image/jpeg': 'picture-o',
  'image/png': 'picture-o'
}

const mimeToTags = {
  'text/plain' : [ 'Documents' ],
  'application/pdf': [ 'Documents' ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [ 'Documents' ],
  'application/msword': [ 'Documents' ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [ 'Documents' ],
  'application/vnd.ms-excel': [ 'Documents' ],
  'application/x-zip': [ 'Archives' ],
  'application/zip': [ 'Archives' ],
  'text/css': [ 'Code' ],
  'text/html': [ 'Code' ],
  'application/javascript': [ 'Code' ],
  'application/xml': [ 'Data' ],
  'image/svg+xml': [ 'Images' ],
  'image/jpeg': [ 'Images' ],
  'image/png': [ 'Images' ]
}

const addSize = ( imageApi, file ) => {
  if( imageApi.isImage( file ) ){
    return imageApi.getSize( file )
      .then(
        size => Promise.resolve( Object.assign( file, size ) )
      )
  } else {
    return Promise.resolve( file )
  }
}

const pregenerateImages = ( imageApi, file, filepath ) => {
  if( presizeImages && imageApi.isRaster( file ) ){
    return imageApi.pregenerate( file, filepath ).then( () => file )
  } else {
    return Promise.resolve( file )
  }
}

const createFile = ( store, api, imageApi, user, body, file ) =>
    addSize( imageApi, file )
      .then(
        file => Object.assign(
          dbItem( file, 'file' ),
          {
            creator: user._id,
            tags: body[ 'file.tags' ]
          }
        )
      )
      .then(
        file =>
          store.saveP( file )
      )
      .then(
        file => new Promise(
          ( resolve, reject ) => {
            const filepath = api.getPath( file )

            const writeStream = fs.createWriteStream( filepath )

            writeStream.on( 'finish', () => {
              resolve( pregenerateImages( imageApi, file, filepath ) )
            })

            fs.createReadStream( file.path ).pipe( writeStream )
          }
        )
      )

const readdir = pify( fs.readdir )
const unlink = pify( fs.unlink )

const unlinkOld = ( directoryPath, prefix ) =>
  readdir( directoryPath )
    .then(
      filenames =>
        Promise.all(
          filenames
            .filter( f => f.indexOf( prefix ) === 0 )
            .map( f => path.join( directoryPath, f ) )
            .map( f => unlink( f ) )
        )
    )

const getPath = ( site, file, options ) => {
  const sitePath = path.join( options.rootDirectory, 'data', 'files', site._id )

  if( !fs.existsSync( sitePath ) ){
    fs.mkdirSync( sitePath );
  }

  const filename = [ file._id, file.originalname ].join( '-' )

  const filepath = path.join( sitePath, filename )

  return filepath
}

const getTags = file => {
  let tags = Array.isArray( file.tags ) ? file.tags.slice() : []

  if( Array.isArray( mimeToTags[ file.mimetype ])){
    tags = tags.concat( mimeToTags[ file.mimetype ] )
  }

  return tags
}

const copyFieldsFromUpload = ( file, upload ) => {
  file.mimetype = upload.mimetype;
  file.originalname = upload.originalname;
  file.path = upload.path
  file.size = upload.size

  if( upload.width && upload.height ){
    file.width = upload.width;
    file.height = upload.height;
  }

  return file
}

const unlinkOldAll = ( site, options, file ) => {
  const cachepath = path.resolve( __dirname, '../../cache' )
  const userFilePath = path.join( options.rootDirectory, 'data', 'files', site._id )

  return Promise.all([
    unlinkOld( cachepath, file._id ),
    unlinkOld( userFilePath, file._id )
  ])
}

const openZip = filepath => new Promise(
  ( resolve, reject ) => {
    yauzl.open( filepath, ( err, zipfile ) => {
      if( err ){
        reject( err )
      } else {
        resolve( zipfile )
      }
    })
  }
)

const create = ( store, site, api, imageApi, user, body, files ) =>
  Promise.all( files.map( file =>
    createFile( store, api, imageApi, user, body, file )
  ))

const edit = ( store, site, api, imageApi, options, file, body, upload ) => {
  const addTags = ( file, body ) => {
    if( Array.isArray( body[ 'file.tags' ] ) ){
      file.tags = body[ 'file.tags' ]
    }

    return Promise.resolve( file )
  }

  if( !upload ){
    return addTags( file, body )
      .then(
        file =>
          store.saveP( file )
      )
  }

  return addSize( imageApi, upload )
    .then(
      upload =>
        copyFieldsFromUpload( file, upload )
    )
    .then(
      file => addTags( file, body )
    )
    .then(
      file =>
        store.saveP( file )
    )
    .then(
      file =>
        unlinkOldAll( site, options, file )
    )
    .then(
      () => new Promise(
        ( resolve, reject ) => {
          const filepath = api.getPath( file )

          const readStream = fs.createReadStream( upload.path )
          const writeStream = fs.createWriteStream( filepath )

          writeStream.on( 'finish', () => {
            resolve( pregenerateImages( imageApi, file, filepath ) )
          })

          readStream.pipe( writeStream )
        }
      )
    )
}


const handleEntry = ( store, api, imageApi, zipfile, entry, options ) => new Promise(
  ( resolve, reject ) => {
    if( /\/$/.test( entry.fileName ) ){
      resolve()
      return
    }

    zipfile.openReadStream( entry, ( err, readStream ) => {
      if( err ){
        reject( err )
      } else {
        const parsed = path.parse( entry.fileName )

        const filename = utils.randomId( 'zip' ) + '-' + parsed.base

        const outfile = path.join( 'uploads', filename )
        const writeStream = fs.createWriteStream( outfile )

        writeStream.on( 'finish', () => {
          const file = dbItem({
            key: 'file',
            originalname: parsed.base,
            mimetype: mime.lookup( entry.fileName ),
            filename: filename,
            path: outfile,
            size: entry.uncompressedSize,
            tags: parsed.dir.split( '/' ).filter( t => t !== '' )
          })

          addSize( imageApi, file )
            .then(
              store.saveP
            )
            .then(
              file => {
                const filepath = api.getPath( file )
                const fileWriteStream = fs.createWriteStream( filepath )

                fileWriteStream.on( 'finish', () => {
                  resolve( pregenerateImages( imageApi, file, filepath ) )
                })

                fs.createReadStream( file.path ).pipe( fileWriteStream )
              }
            )
            .catch(
              err => reject( err )
            )
        })

        readStream.pipe( writeStream )
      }
    })
  }
)

const unzipAll = ( store, site, api, imageApi, filepath, options ) =>
  openZip( filepath )
    .then(
      zipfile => new Promise(
        ( resolve, reject ) => {
          const entryPromises = []
          zipfile.on( 'entry', entry => {
            entryPromises.push( handleEntry( store, api, imageApi, zipfile, entry, options ) )
          })
          zipfile.on( 'close', () => {
            resolve( Promise.all( entryPromises ))
          })
        }
      )
    )

const trash = ( store, file ) => {
  if( Array.isArray( file.tags ) ){
    file.tags.push( 'Trash' )
  } else {
    file.tags = [ 'Trash' ]
  }

  return store.saveP( file )
}

const isTrash = file => Array.isArray( file.tags ) && file.tags.includes( 'Trash' )

const defaultOptions = {
  rootDirectory: process.cwd()
}

const readFile = pify( fs.readFile )
const writeFile = pify( fs.writeFile )
const stat = pify( fs.stat )

const fileExists = filepath => new Promise( resolve => {
  stat( filepath )
    .then( s => resolve( true ) )
    .catch( err => resolve( err.code !== 'ENOENT' ) )
})

const bundle = ( store, site, api, options, files, name ) => {
  const filesSignature = files.reduce( ( sig, f ) => {
    return sig + f._id + f._updated
  }, '' )

  const hash = crypto.createHash( 'md5' ).update( filesSignature ).digest( 'hex' )
  const newName = hash + name
  const cachedPath = path.join( options.rootDirectory, 'cache', newName )

  const createBundle = () => {
    return Promise.all( files.map( api.getPath ) )
      .then(
        paths => Promise.all( paths.map( p => readFile( p, 'utf8' ) ) )
      )
      .then(
        contents => contents.join( '\n' )
      )
      .then(
        contents => writeFile( cachedPath, contents, 'utf8' )
      )
  }

  return fileExists( cachedPath )
    .then(
      exists => {
        if( exists ){
          return cachedPath
        } else {
          return createBundle()
            .then(
              () => cachedPath
            )
        }
      }
    )
}

const FileApi = ( store, site, opts ) => {
  const options = Object.assign( {}, defaultOptions, opts )

  const imageApi = require( './image-api' )()

  const api = {
    getUrl: file => '/files/' + file._id + '/' + file.originalname,

    getPath: file => getPath( site, file, options ),

    getIcon: file => mimeToIcon[ file.mimetype ] || 'file-o',

    getTags: getTags,

    create: ( user, body, files ) => create( store, site, api, imageApi, user, body, files ),

    edit: ( file, body, upload ) => edit( store, site, api, imageApi, options, file, body, upload ),

    processZip: file => unzipAll( store, site, api, imageApi, file.path, options ),

    bundle: ( files, name ) => bundle( store, site, api, options, files, name ),

    trash: file => trash( store, file ),

    isTrash: file => isTrash( file )
  }

  return api
}

module.exports = FileApi
