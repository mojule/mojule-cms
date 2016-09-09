'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const fs = require( 'fs' )
const path = require( 'path' )
const pify = require( 'pify' )
const ImageApi = require( '../src/api/image-api' )
const initDirs = require( '../src/init-dirs' )

const filesInPath = directory => new Promise(
  ( resolve, reject ) => {
    fs.readdir( directory, ( err, files ) => {
      if( err ){
        reject( err )
      } else {
        resolve( files.map( filename => path.join( directory, filename ) ) )
      }
    })
  }
)

const unlink = pify( fs.unlink )
const unlinkAll = filenames => Promise.all( filenames.map( filename => unlink( filename ) ) )

const unlinkAllInPath = directory => 
  filesInPath( directory )
    .then(
      filenames => unlinkAll( filenames )
    )

//fixtures
const getFiles = () => {
  return [
    {
      "originalname" : "Mt-Eden.png",
      "mimetype" : "image/png",
      "filename" : "zip-5d292cc6cbaf5dd2a435391ebc394754-Mt-Eden.png",
      "path" : "uploads\\zip-5d292cc6cbaf5dd2a435391ebc394754-Mt-Eden.png",
      "size" : 257071,
      "tags" : ["Branches"],
      "key" : "file",
      "_id" : "file-0039acf06f6c7e2edbe7865cad898c46",
      "width" : 500,
      "height" : 324,
      "_created" : "2015-11-16T21:27:37.823Z",
      "_updated" : "2015-11-16T21:27:37.823Z"
    },
    {
      "fieldname" : "file",
      "originalname" : "omron .svg",
      "encoding" : "7bit",
      "mimetype" : "image/svg+xml",
      "destination" : "uploads/",
      "filename" : "upload-3d584d30ac91d311d6f2ae86c99fc844-omron .svg",
      "path" : "uploads\\upload-3d584d30ac91d311d6f2ae86c99fc844-omron .svg",
      "size" : 5150,
      "key" : "file",
      "_id" : "file-01cfcc5c0ddb88f90a8211b056304025",
      "creator" : "user-71d2e62941a3a3c7abe26edcf02acd4e",
      "width" : 1190.5,
      "height" : 850.4,
      "_created" : "2015-09-23T03:50:27.375Z",
      "_updated" : "2015-09-23T03:50:27.375Z"
    },
    {
      "fieldname" : "file",
      "originalname" : "main.css",
      "encoding" : "7bit",
      "mimetype" : "text/css",
      "destination" : "uploads/",
      "filename" : "upload-c304aa954a458142d78ad3fffd7f9d64-main.css",
      "path" : "uploads\\upload-c304aa954a458142d78ad3fffd7f9d64-main.css",
      "size" : 81,
      "key" : "file",
      "_id" : "file-17421d377ec5402135bffc7117becf5f",
      "creator" : "user-e9b137b147e82bda10d9b64113f79d95",
      "_created" : "2015-09-23T22:35:08.617Z",
      "_updated" : "2015-11-19T22:21:24.856Z"
    }
  ]
}

const setupImageFile = () => {
  //as per https://github.com/expressjs/multer
  return {
    "_id": "Test Image",
    "originalname" : "zeus.jpg",
    "mimetype" : "image/jpeg",
    "path" : "test\\fixtures\\zeus.jpg",
    "size" : 26433,
    "width": 640,
    "height": 360
  }  
}

describe( 'Image API', () => {    
  before( () => initDirs() )
  
  after( () => 
    unlinkAllInPath( 'test/fixtures/cache' )      
  )  
  
  describe( 'Is image', () => {
    it( 'should determine if a file is an image', () => done => {
      const api = ImageApi()
      const files = getFiles()
      
      assert( api.isImage( files[ 0 ] ) )
      assert( api.isImage( files[ 1 ] ) )
      assert( !api.isImage( files[ 2 ] ) )
      
      done()
    })
  })  

  describe( 'Is raster', () => {
    it( 'should determine if an image is a raster format', done => {
      const api = ImageApi()
      const files = getFiles()
      
      assert( api.isRaster( files[ 0 ] ) )
      assert( !api.isRaster( files[ 1 ] ) )
      assert( !api.isRaster( files[ 2 ] ) )
      
      done()
    })
  })
    
  describe( 'Get URL', () => {
    it( 'should get an URL for an image', done => {
      const api = ImageApi()
      const files = getFiles()
      
      //not comprehensive:
      //  only tests that it returns a URL into the files controller
      
      const url = api.getUrl( files[ 0 ] )
      
      assert.equal( url.indexOf( '/files' ), 0 )
      
      done()
    })
  })  
      
  describe( 'Get Size', () => {
    it( 'should get the native size of an image', () => {
      const api = ImageApi()
      const files = getFiles()
      
      //not comprehensive:
      //  only tests images that already have width/height set
      //  to test that it can get a size from a file would require test files
      
      return api.getSize( files[ 0 ] )
        .then(
          size => {
            assert.deepEqual( size, { width: 500, height: 324 } )
          }
        )
    })
  })  
    
  describe( 'Get Ratio', () => {
    it( 'should get an aspect ratio for an image', () => {
      const api = ImageApi()
      const files = getFiles()
      
      //not comprehensive for same reason as above, because getRatio calls 
      //getSize under the hood
      return api.getRatio( files[ 0 ] )
        .then(
          ratio => {
            assert.equal( ratio, 'landscape' )
          }
        )      
    })
  })  
  
  describe( 'Resize', () =>{
    it( 'should resize an image', () => {
      const options = {
        rootDirectory: path.join( process.cwd(), './test/fixtures' ),
        cacheDirectory: 'cache'
      }
      
      const api = ImageApi( options )
      const file = setupImageFile()
            
      //not comprehensive, does not test all options
      return api.resize( file, file.path, [ 320 ] )
        .then(
          newPath => {
            assert( fs.existsSync( newPath ) )
          }
        )
    })
  })
})
