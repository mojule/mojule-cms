'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const Store = require( '../dependencies/store/mem-store' )
const PageApi = require( '../src/api/page-api' )
const templates = require( '../src/template-engine' )
const initDirs = require( '../src/init-dirs' )

const setupStylesheets = () => {
  return [
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
    },
    {
      "fieldname" : "file",
      "originalname" : "main2.css",
      "encoding" : "7bit",
      "mimetype" : "text/css",
      "destination" : "uploads/",
      "filename" : "upload-e9b137b147e82bda10d9b64113f79d95-main.css",
      "path" : "uploads\\upload-e9b137b147e82bda10d9b64113f79d95-main.css",
      "size" : 81,
      "key" : "file",
      "_id" : "file-e9b137b147e82bda10d9b64113f79d95",
      "creator" : "user-e9b137b147e82bda10d9b64113f79d95",
      "_created" : "2015-09-23T22:35:08.617Z",
      "_updated" : "2015-11-19T22:21:24.856Z"
    }
  ]
}

const setupSite = store => {
  const user = { _id: 'Test User' }
  let site = { name: 'Test Site', key: 'site' }
  let templateApi

  return store.saveP( site )
    .then(
      savedSite => {
        site = savedSite
      }
    )
    .then(
      () => {
        templateApi = require( '../src/api/template-api' )( site, store )
      }
    )
    .then(
      () => {
        return templateApi.defaultMaster( user )
      }
    )
    .then(
      master => {
        site.master = master._id
      }
    )
    .then(
      () => store.saveP( site )
    )
}

describe( 'Page API', () => {
  before( () => initDirs() )

  describe( 'New Page', () => {
    it( 'should set up a page for the first time', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home'
      }

      let site
      let api

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          page => store.loadP( page.document )
        )
        .then(
          document => {
            assert( document )
          }
        )
    })
  })

  describe( 'Create Page', () => {
    it( 'should create a new page from a form post/model', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => {
            return api.newPage( homePage, user )
          }
        )
        .then(
          home => {
            body[ 'page.parent' ] = home._id
          }
        )
        .then(
          () => {
            return api.create( user, body )
          }
        )
        .then(
          result => {
            assert( result.valid )
          }
        )
    })
  })

  describe( 'Edit Page', () => {
    it( 'should edit an existing page', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.slug': 'test-page',
        'page.tags': []
      }

      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            body[ 'page.parent' ] = home._id
          }
        )
        .then(
          () => api.create( user, body )
        )
        .then(
          result => result.data
        )
        .then(
          existingPage => {
            const editModel = {
              'page.name': 'Test Page 2',
              'page.order': 0,
              'page.parent': existingPage.parent._id,
              'page.slug': 'test-page-2',
              'page.tags': []
            }

            return api.edit( existingPage, editModel )
          }
        )
        .then(
          result => {
            assert( result.valid )

            return result.data
          }
        )
        .then(
          editedPage => {
            assert.equal( editedPage.name, 'Test Page 2' )
          }
        )
    })
  })

  describe( 'Get Route', () => {
    it( 'should return a URL route to the page', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id
            body1[ 'page.parent' ] = home._id
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            body2[ 'page.parent' ] = page1._id

            return api.create( user, body2 )
          }
        )
        .then(
          result => result.data
        )
        .then(
          page => api.getRoute( page )
        )
        .then(
          route => {
            assert.equal( route, '/test-page/test-page-2/' )
          }
        )
    })
  })

  describe( 'Get Page', () => {
    it( 'should find a page matching a URL route', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let id
      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id
            body1[ 'page.parent' ] = home._id
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            body2[ 'page.parent' ] = page1._id

            return api.create( user, body2 )
          }
        )
        .then(
          result => result.data
        )
        .then(
          page => {
            id = page._id
            return api.getRoute( page )
          }
        )
        .then(
          route => api.getPage( route )
        )
        .then(
          page => {
            assert.equal( page._id, id )
          }
        )
    })
  })

  describe( 'Get Styles', () => {
    it( 'should get a list of URLS for all the stylesheets used by a page', () => {
      const store = Store( 'cms' )

      const styles = setupStylesheets()
      const homePage = {
        'name': 'Home'
      }
      const user = { _id: 'Test User' }

      let site
      let api

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store )
          }
        )
        .then(
          () =>  Promise.all( styles.map( style => store.saveP( style ) ))
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          homePage => {
            homePage.stylesheets = styles.map( s => ({ name: s.originalname, _id: s._id }) )

            return store.saveP( homePage )
          }
        )
        .then(
          homePage => api.getStyles( homePage )
        )
        .then(
          styleUrls => {
            assert.equal( styleUrls.length, 2 )
          }
        )
    })
  })

  describe( 'Page Link Map', () => {
    it( 'should get an associative map linking page IDs to routes', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let dbHomePage
      let dbTestPage
      let dbHomeRoute
      let dbTestRoute
      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            dbHomePage = home
            body[ 'page.parent' ] = home._id
            site.homePage = home._id
          }
        )
        .then(
          () => api.create( user, body )
        )
        .then(
          result => {
            dbTestPage = result.data
          }
        )
        .then(
          () => api.getRoute( dbHomePage )
        )
        .then(
          route => {
            dbHomeRoute = route
          }
        )
        .then(
          () => api.getRoute( dbTestPage )
        )
        .then(
          route => {
            dbTestRoute = route
          }
        )
        .then(
          () => api.pageLinkMap()
        )
        .then(
          pageLinkMap => {
            const keys = Object.keys( pageLinkMap )

            assert.equal( keys.length, 2 )

            assert( pageLinkMap[ dbHomePage._id ] )
            assert.equal( pageLinkMap[ dbHomePage._id ], dbHomeRoute )
          }
        )
    })
  })

  describe( 'Get Home', () => {
    it( 'should return the home page of the site', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home'
      }

      const body = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null
      }

      let dbHomePage
      let site
      let api

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            dbHomePage = home
            body[ 'page.parent' ] = home._id
            site.homePage = home._id
          }
        )
        .then(
          () => api.getHome()
        )
        .then(
          homePage => {
            assert.equal( homePage._id, dbHomePage._id )
          }
        )
    })
  })

  describe( 'Get Path', () => {
    it( 'should return an array of pages representing the path to the current page', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let homeId
      let page1Id
      let page2Id

      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id
            body1[ 'page.parent' ] = home._id
            homeId = home._id
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            body2[ 'page.parent' ] = page1._id
            page1Id = page1._id

            return api.create( user, body2 )
          }
        )
        .then(
          result => result.data
        )
        .then(
          page => {
            page2Id = page._id
            return page
          }
        )
        .then(
          page => api.getPath( page )
        )
        .then(
          pages => {
            assert.equal( pages[ 0 ]._id, homeId )
            assert.equal( pages[ 1 ]._id, page1Id )
            assert.equal( pages[ 2 ]._id, page2Id )
          }
        )
    })
  })

  describe( 'Get Child Pages', () => {
    it( 'should get the child pages of the specified page', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let dbHomePage
      let dbPage1
      let dbPage2
      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id

            body1[ 'page.parent' ] = home._id
            body2[ 'page.parent' ] = home._id

            dbHomePage = home
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            dbPage1 = page1

            return api.create( user, body2 )
          }
        )
        .then(
          result => result.data
        )
        .then(
          page2 => {
            dbPage2 = page2
          }
        )
        .then(
          () => api.getChildPages( dbHomePage )
        )
        .then(
          children => {
            assert.equal( children.length, 2 )
          }
        )
    })
  })

  describe( 'Is Top Level', () => {
    it( 'should determine if a page is the home page or a direct child of home', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let dbHomePage
      let dbPage1
      let dbPage2
      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id
            body1[ 'page.parent' ] = home._id
            dbHomePage = home
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            body2[ 'page.parent' ] = page1._id
            dbPage1 = page1
          }
        )
        .then(
          () => api.create( user, body2 )
        )
        .then(
          result => result.data
        )
        .then(
          page2 => {
            dbPage2 = page2
          }
        )
        .then(
          () => api.isTopLevel( dbHomePage )
        )
        .then(
          isTop => assert( isTop )
        )
        .then(
          () => api.isTopLevel( dbPage1 )
        )
        .then(
          isTop => assert( isTop )
        )
        .then(
          () => api.isTopLevel( dbPage2 )
        )
        .then(
          isTop => assert( !isTop )
        )
    })
  })

  describe( 'Get Tree', () => {
    it( 'should get a graph of the site page structure', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let dbHomePage
      let dbPage1
      let dbPage2
      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id
            body1[ 'page.parent' ] = home._id
            dbHomePage = home
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            body2[ 'page.parent' ] = page1._id
            dbPage1 = page1
          }
        )
        .then(
          () => api.create( user, body2 )
        )
        .then(
          result => result.data
        )
        .then(
          page2 => {
            dbPage2 = page2
          }
        )
        .then(
          () => api.getTree()
        )
        .then(
          tree => {
            assert.equal( tree._id, dbHomePage._id )
            assert.equal( tree.children.length, 1 )
            assert.equal( tree.children[ 0 ]._id, dbPage1._id )
            assert.equal( tree.children[ 0 ].children.length, 1 )
            assert.equal( tree.children[ 0 ].children[ 0 ]._id, dbPage2._id )
          }
        )
    })
  })

  describe( 'Get Graph Map', () => {
    it( 'should get a node/tree representation of the site page structure', () => {
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }

      const homePage = {
        'name': 'Home',
        'tags': []
      }

      const body1 = {
        'page.name': 'Test Page',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      const body2 = {
        'page.name': 'Test Page 2',
        'page.order': 0,
        'page.parent': null,
        'page.tags': []
      }

      let dbHomePage
      let dbPage1
      let dbPage2
      let site
      let api
      let session = {}

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store, session )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => {
            site.homePage = home._id
            body1[ 'page.parent' ] = home._id
            dbHomePage = home
          }
        )
        .then(
          () => api.create( user, body1 )
        )
        .then(
          result => result.data
        )
        .then(
          page1 => {
            body2[ 'page.parent' ] = page1._id
            dbPage1 = page1
          }
        )
        .then(
          () => api.create( user, body2 )
        )
        .then(
          result => result.data
        )
        .then(
          page2 => {
            dbPage2 = page2
          }
        )
        .then(
          () => api.getGraphMap()
        )
        .then(
          map => {
            assert.equal( map[ 0 ].depth, 0 )
            assert.equal( map[ 1 ].depth, 1 )
            assert.equal( map[ 2 ].depth, 2 )
          }
        )
    })
  })

  describe( 'Render', () => {
    it( 'should wrap renderDocument with a caching function', () => {
      const homePage = {
        'name': 'Home'
      }
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }
      let site
      let api

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => new Promise(
            ( resolve, reject ) => {
              site.homePage = home._id

              templates.init( './views', '.html', err => {
                if( err ){
                  reject( err )
                } else {
                  resolve( api.render( home, templates.templates, {} ) )
                }
              })
            }
          )
        )
        .then(
          html => {
            assert.equal( typeof html, 'string' )
          }
        )
    })
  })

  describe( 'Render Document', () => {
    it( 'should generate the HTML for a given page', () => {
      const homePage = {
        'name': 'Home'
      }
      const store = Store( 'cms' )
      const user = { _id: 'Test User' }
      let site
      let api

      return setupSite( store )
        .then(
          newSite => {
            site = newSite
            api = PageApi( site, store )
          }
        )
        .then(
          () => api.newPage( homePage, user )
        )
        .then(
          home => new Promise(
            ( resolve, reject ) => {
              site.homePage = home._id

              templates.init( './views', '.html', err => {
                if( err ){
                  reject( err )
                } else {
                  resolve( api.renderDocument( home, templates.templates, {} ) )
                }
              })
            }
          )
        )
        .then(
          html => {
            assert.equal( typeof html, 'string' )
          }
        )
    })
  })

})