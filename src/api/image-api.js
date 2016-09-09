'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const pify = require( 'pify' )
const resizer = require( '../resizer' )
const getRasterSize = require( '../get-size' )
const Configurator = require( '../configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const presizeImages = configurator.imageResize().presize

const rasterMimes = [
  'image/png',
  'image/jpeg',
  'image/gif'
]

const imageMimes = rasterMimes.concat([
  'image/svg+xml'
])

// determined by statistical analysis of production server logs
/*
    <= 64     4.87%
    <= 128   12.66%
    <= 192   18.03%
    <= 256   12.22%
    <= 384   16.21%
    <= 579   16.12%
    <= 1024  16.15%
    <= 1600   3.40%
*/
const imageBreakPoints = [ 64, 128, 192, 256, 384, 576, 1024, 1600 ]

const readFile = pify( fs.readFile )
const writeFile = pify( fs.writeFile )
const parseXml = pify( require( 'xml2js' ).parseString )

const save = ( path, bytes ) => {
  return writeFile( path, bytes )
    .then(
      () => Promise.resolve( path )
    )
}

const getBreakPointParams = ( file, params ) => {
  const paramType = getParamType( params )

  const newSize = getNewSize[ paramType ]( file, params )

  const maxBreakPointWidth = Math.max.apply( null, imageBreakPoints )

  if( newSize.width > file.width || newSize.width > maxBreakPointWidth ){
    return file.width
  }

  const width = Math.min.apply( null, imageBreakPoints.filter( b => b >= newSize.width ) )

  return [ width ]
}

const getParamType = params => Object.keys( paramTests ).find( key => paramTests[ key ]( params ) )

const paramTests = {
  fitToWidth: params => Number( params[ 0 ] ) > 0,
  fitToHeight: params => params.length > 1 && params[ 0 ] === 'h' && Number( params[ 1 ] ) > 0,
  fitToRect: params => params.length > 2 && params[ 0 ] === 'f' && Number( params[ 1 ] ) > 0 && Number( params[ 2 ] ) > 0,
  default: params => true
}

const getNewSize = {
  fitToWidth: ( file, params ) => {
    const width = Number( params[ 0 ] )
    const w = file.width

    if( width > w ){
      return {
        width: file.width,
        height: file.height
      }
    }

    const scale = width / w
    const height = Math.trunc( file.height * scale )

    return { width, height }
  },
  fitToHeight: ( file, params ) => {
    const height = Number( params[ 1 ] )
    const h = file.height

    if( height > h ){
      return {
        width: file.width,
        height: file.height
      }
    }

    const scale = height / h
    const width = Math.trunc( file.width * scale )

    return { width, height }
  },
  fitToRect: ( file, params ) => {
    let width = Number( params[ 1 ] )
    let height = Number( params[ 2 ] )

    const w = file.width;
    const h = file.height;

    const scale = Math.min( width / w, height / h )

    if( scale >= 1 ){
      return {
        width: file.width,
        height: file.height
      }
    }

    width = Math.trunc( w * scale )
    height = Math.trunc( h * scale )

    return { width, height }
  },
  default: ( file, params ) => {
    return {
      width: file.width,
      height: file.height
    }
  }
}

const getSvgSize = filePath =>
  readFile( filePath, 'utf-8' )
    .then(
      parseXml
    )
    .then(
      doc => {
        const root = doc.svg
        const attrs = root.$

        if( attrs.width && attrs.height ){
          return Promise.resolve({
            width: Number( attrs.width ),
            height: Number( attrs.height )
          })
        }

        const viewBox = attrs.viewBox.split( ' ' )

        return Promise.resolve({
          width: Number( viewBox[ 2 ] ),
          height: Number( viewBox[ 3 ] )
        })
      }
    )

const resize = ( file, filepath, params, options ) => new Promise(
  ( resolve, reject ) => {
    if( file.mimetype === 'image/gif' ){
      resolve( filepath )
      return
    }

    if( presizeImages ){
      params = getBreakPointParams( file, params )
    }

    const paramType = getParamType( params )
    const newSize = getNewSize[ paramType ]( file, params )
    const width = newSize.width
    const height = newSize.height

    if( width >= file.width && height >= file.height ){
      resolve( filepath )
      return
    }

    const newName = [ file._id ].concat( params ).concat( file.originalname ).join( '-' );
    let newPath = path.join( options.rootDirectory, options.cacheDirectory, newName )

    fs.exists( newPath, exists => {
      if( exists ){
        resolve( newPath )
        return
      }

      resolve(
        resizer( filepath, file.mimetype, width, height )
        .then(
          bytes => save( newPath, bytes )
        )
      )
    })
  }
)

const pregenerate = ( file, filepath, options ) =>
  Promise.all( imageBreakPoints.map( width => resize( file, filepath, [ width ], options ) ) )

const isRaster = file => rasterMimes.includes( file.mimetype )
const isImage = file => imageMimes.includes( file.mimetype )

const getUrl = ( file, options ) => {
  let url = '/files/' + file._id

  if( isRaster( file ) && options ){
    if( options.strategy === 'fitToWidth' ){
      url += '/' + options.width
    } else if( options.strategy === 'fitToHeight' ){
      url += '/h/' + options.height
    } else if( options.strategy === 'fitToRect' ){
      url += '/f/' + options.width + '/' + options.height
    }
  }

  url += '/' + file.originalname

  return url
}

const getSize = ( file, options ) => {
  if( file.width && file.height ){
    return Promise.resolve({
      width: file.width,
      height: file.height
    })
  }

  const filepath = path.join( options.rootDirectory, file.path )

  if( file.mimetype === 'image/svg+xml' ){
    return getSvgSize( filepath )
  }

  return getRasterSize( filepath )
}

const getRatio = file =>
  getSize( file )
    .then(
      size => {
        if( size.width === size.height ){
          return Promise.resolve( 'square' )
        }

        if( size.width > size.height ){
          return Promise.resolve( 'landscape' )
        }

        return Promise.resolve( 'portrait' )
      }
    )


const defaultOptions = {
  rootDirectory: process.cwd(),
  cacheDirectory: 'cache'
}

const ImageApi = opts => {
  const options = Object.assign( {}, defaultOptions, opts )

  const api = {
    isRaster,
    isImage,
    resize: ( file, filepath, params ) => resize( file, filepath, params, options ),
    pregenerate: ( file, filepath ) => pregenerate( file, filepath, options ),
    getUrl,
    getSize: file => getSize( file, options ),
    getRatio
  }

  return api
}

module.exports = ImageApi
