'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const SiteApi = require( '../src/api/site-api' )
const Store = require( '../dependencies/store/mem-store' )
const Logger = require( '../src/bunyan-logger' )
const initDirs = require( '../src/init-dirs' )

const setupStyle = () => ({
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
})

const logger = Logger( Store, 'tests' )

describe( 'Site API', () => {
  before( () => initDirs() )

  describe( 'Create Site', () => {
    it( 'should create a new site from a model', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )
      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      return api.create( user, model )
        .then(
          result => {
            assert( result.valid )
          }
        )
    })
  })

  describe( 'Edit Site', () => {
    it( 'should edit an existing site from a model', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )

      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      const stores = deps.stores

      return api.create( user, model )
        .then(
          result => result.data
        )
        .then(
          newSite => {
            const model = {
              "site.name": newSite.name,
              "site.urls": [ "example.net" ]
            }

            return api.edit( stores, newSite, model )
          }
        )
        .then(
          result => assert( result.valid )
        )
    })
  })

  describe( 'Get Store', () => {
    it( 'should get a store for a site', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )

      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      const stores = deps.stores

      return api.create( user, model )
        .then(
          result => result.data
        )
        .then(
          newSite => api.getStore( stores, newSite )
        )
        .then(
          store => {
            assert.equal( typeof store.saveP, 'function' )
          }
        )
    })
  })

  describe( 'Site Data', () => {
    it( 'should get all the data associated with a site', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )

      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      const stores = deps.stores

      return api.create( user, model )
        .then(
          result => result.data
        )
        .then(
          newSite => api.siteData( stores, newSite )
        )
        .then(
          site => assert( Array.isArray( site.items ) )
        )
    })
  })

  describe( 'Get Site', () => {
    it( 'should determine which db site to use from URL', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )

      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      let site

      return api.create( user, model )
        .then(
          result => result.data
        )
        .then(
          newSite => {
            site = newSite

            return api.getSite( user, "http://example.com/")
          }
        )
        .then(
          siteFromUrl => assert.equal( site._id, siteFromUrl._id )
        )
    })
  })

  describe( 'Get Styles', () => {
    it( 'should get a list of URLs to all of the user-uploaded stylesheets associated with the site', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )

      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const style = setupStyle()

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      const stores = deps.stores
      let site
      let siteStore
      return api.create( user, model )
        .then(
          result => result.data
        )
        .then(
          newSite => {
            site = newSite

            return api.getStore( stores, site )
          }
        )
        .then(
          result => {
            siteStore = result

            return siteStore.saveP( style )
          }
        )
        .then(
          () => {
            site.stylesheets = [ { name: 'main.css', _id: style._id } ]

            return store.saveP( site )
          }
        )
        .then(
          () => api.getStyles( stores, site )
        )
        .then(
          styleUrls => {
            assert.equal( typeof styleUrls[ 0 ], 'string' )
          }
        )
    })
  })

  describe( 'Get File Path', () => {
    it( 'should get a list of disk paths to all of the user-uploaded files associated with the site', () => {
      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const api = SiteApi( Store, deps, session )

      const user = { _id: 'Test User', email: 'noreply@example.com', sites: [] }

      const style = setupStyle()

      const model = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      const stores = deps.stores
      let site
      let siteStore
      return api.create( user, model )
        .then(
          result => result.data
        )
        .then(
          newSite => {
            site = newSite

            return api.getStore( stores, site )
          }
        )
        .then(
          result => {
            siteStore = result

            return siteStore.saveP( style )
          }
        )
        .then(
          () => {
            site.stylesheets = [ { name: 'main.css', _id: style._id } ]

            return store.saveP( site )
          }
        )
        .then(
          () => api.filePaths( stores, site )
        )
        .then(
          filePaths => {
            assert.equal( typeof filePaths[ 0 ], 'string' )
          }
        )
    })
  })
})
