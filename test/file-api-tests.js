'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const fs = require( 'fs' )
const path = require( 'path' )
const pify = require( 'pify' )
const Store = require( '../dependencies/store/mem-store' )
const FileApi = require( '../src/api/file-api' )
const initDirs = require( '../src/init-dirs' )

//fixtures here
const getOptions = () => ({
  rootDirectory: path.join( process.cwd(), '/test/fixtures/' )
})

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

const setupCreateFile = () => {
  //as per https://github.com/expressjs/multer
  return {
    "originalname" : "zeus.jpg",
    "mimetype" : "image/jpeg",
    "path" : "test\\fixtures\\zeus.jpg",
    "size" : 26433
  }
}

const setupEditFile = () => {
  return {
    "originalname" : "bigdog.jpg",
    "mimetype" : "image/jpeg",
    "path" : "test\\fixtures\\bigdog.jpg",
    "size" : 118420
  }
}

const setupZipFile = () => {
  return {
    "path" : "test\\fixtures\\animals.zip"
  }
}

const site = {
  _id: 'Test Site'
}

const user = {
  _id: 'Test User'
}

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

describe( 'File API', () => {
  before( () => initDirs() )

  after( () =>
    unlinkAllInPath( path.join( 'test/fixtures/data/files/', site._id ) )
      .then(
        () => unlinkAllInPath( 'test/fixtures/uploads' )
      )
  )

  describe( 'Get URL', () => {
    it( 'should get a URL for a file', done => {
      const options = getOptions()
      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site, options )
      const files = getFiles()

      //not comprehensive:
      //  only tests that it returns a URL into the files controller

      const url = api.getUrl( files[ 0 ] )

      assert.equal( url.indexOf( '/files' ), 0 )

      done()
    })
  })

  describe( 'Get path', () => {
    it( 'should get a disk path for a file', done => {
      const options = getOptions()
      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site, options )
      const files = getFiles()

      const path = api.getPath( files[ 0 ] )

      assert( path.indexOf( 'data\\files' ) !== -1 )

      done()
    })
  })


  describe( 'API Options', () => {
    it( 'should allow root directory to be set in options', done => {
      const options = getOptions()
      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site, options )
      const files = getFiles()

      const path = api.getPath( files[ 0 ] )

      assert( path.indexOf( 'test\\fixtures\\data\\files' ) !== -1 )

      done()
    })
  })

  describe( 'Get icon', () => {
    it( 'should get an icon name for a file', done => {
      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site )
      const files = getFiles()

      assert.equal( api.getIcon( files[ 0 ] ), 'picture-o' )
      assert.equal( api.getIcon( files[ 1 ] ), 'picture-o' )
      assert.equal( api.getIcon( files[ 2 ] ), 'file-code-o' )

      done()
    })
  })

  describe( 'Get tags', () => {
    it( 'should get tags for a file', done => {
      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site )
      const files = getFiles()

      assert.deepEqual( api.getTags( files[ 0 ] ), [ 'Branches', 'Images' ] )
      assert.deepEqual( api.getTags( files[ 1 ] ), [ 'Images' ] )
      assert.deepEqual( api.getTags( files[ 2 ] ), [ 'Code' ] )

      done()
    })
  })

  describe( 'Create', () => {
    it( 'should create a new file', () => {
      const options = getOptions()

      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site, options )
      const createFile = setupCreateFile()
      const tags = [ 'tag1', 'tag2' ]
      const body = {
        'file.tags': tags
      }

      return api.create( user, body, [ createFile ] )
        .then(
          files => {
            const createdFile = files[ 0 ]

            const newPath = api.getPath( createdFile )

            assert( fs.existsSync( newPath ) )
            assert.deepEqual( createdFile.tags, tags )
          }
        )
    })
  })

  describe( 'Edit', () => {
    it( 'should edit an existing file', () => {
      const options = getOptions()

      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site, options )
      const createFile = setupCreateFile()
      const editFile = setupEditFile()

      const tags = [ 'tag1', 'tag2' ]
      const editTags = tags.concat( [ 'tag3', 'tag4' ] )

      const createBody = {
        'file.tags': tags
      }

      const editBody = {
        'file.tags': editTags
      }

      let oldSize

      return api.create( user, createBody, [ createFile ] )
        .then(
          files => files[ 0 ]
        )
        .then(
          createdFile => {
            oldSize = createdFile.size

            return api.edit( createdFile, editBody, editFile )
          }
        )
        .then(
          //this relies on us knowing that the test files are different sizes
          editedFile => {
            assert( editedFile.size !== oldSize )
            assert.deepEqual( editedFile.tags, editTags )
          }
        )
    })
  })

  describe( 'ZIP', () => {
    it( 'should add files from a zip', () => {
      const options = getOptions()

      const cmsStore = Store( 'cms' )
      const api = FileApi( cmsStore, site, options )

      const zip = setupZipFile()

      return api.processZip( zip )
        .then(
          () => cmsStore.getP( 'file' )
        )
        .then(
          files => {
            assert.equal( files.length, 2 )
          }
        )
    })
  })
})
