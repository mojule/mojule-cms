'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const MemStore = require( '../dependencies/store/mem-store' )
const PageApi = require( '../src/api/page-api' )
const SiteApi = require( '../src/api/site-api' )
const StoreApi = require( '../src/api/store-api' )
const Logger = require( '../src/bunyan-logger' )
const initDirs = require( '../src/init-dirs' )

//fixtures
const setupFiles = () => {
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

const setupTemplates = () => ([
  {
    "key" : "template",
    "creator" : "user-e9b137b147e82bda10d9b64113f79d95",
    "children" : [{
        "_id" : "box-3051869e1928c5e14758cea27a3659c0",
        "key" : "box",
        "values" : {
          "classes" : ["user-panel-light"],
          "isLocked" : true
        },
        "children" : [{
            "_id" : "columns-16de97e2da15ba7c9b4bc81080292735",
            "key" : "columns",
            "values" : {
              "classes" : [],
              "collapsed" : false,
              "isLocked" : true
            },
            "children" : [{
                "_id" : "column-6761e5eca336fc50367b4186e02bb8a5",
                "key" : "column",
                "values" : {
                  "classes" : [],
                  "large" : {
                    "width" : 3
                  },
                  "medium" : {
                    "width" : 12
                  },
                  "small" : {
                    "width" : 12
                  },
                  "isEnd" : true,
                  "isLocked" : true
                },
                "children" : [{
                    "_id" : "image-3a56c2f5a2e0f40e0d8406d4e6d23858",
                    "key" : "image",
                    "values" : {
                      "classes" : [],
                      "src" : "/img/placeholder.svg",
                      "isLocked" : false
                    }
                  }
                ]
              }, {
                "_id" : "column-505d120bbc48d9af41603c227aaece0b",
                "key" : "column",
                "values" : {
                  "classes" : [],
                  "large" : {
                    "width" : 9
                  },
                  "medium" : {
                    "width" : 12
                  },
                  "small" : {
                    "width" : 12
                  },
                  "isEnd" : true,
                  "isLocked" : true
                },
                "children" : [{
                    "_id" : "heading-77069f703f20c9f1c5a687f785c3c7f3",
                    "key" : "heading",
                    "values" : {
                      "classes" : [],
                      "level" : 3,
                      "html" : "Name",
                      "isLocked" : false
                    }
                  }, {
                    "_id" : "heading-d49e8b07cd9f99aeba084f7c41732a65",
                    "key" : "heading",
                    "values" : {
                      "classes" : [],
                      "level" : 4,
                      "html" : "Title",
                      "isLocked" : false
                    }
                  }, {
                    "_id" : "box-deb77e0dfa3a091a132b918af1d2346d",
                    "key" : "box",
                    "values" : {
                      "classes" : [],
                      "isLocked" : false
                    },
                    "children" : [{
                        "_id" : "paragraph-e1d39c1d6e6bb0ab6e9e5918e22de225",
                        "key" : "paragraph",
                        "values" : {
                          "classes" : [],
                          "html" : "Bio",
                          "isLocked" : false
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "values" : {
      "name" : "Bio",
      "isLocked" : true
    },
    "name" : "Bio",
    "_id" : "template-1fc4e543350adcff3929f0e7f00636bb",
    "_created" : "2015-08-31T01:04:14.734Z",
    "_updated" : "2015-10-06T21:52:17.040Z"
  },
  {
    "key" : "template",
    "creator" : "user-e9b137b147e82bda10d9b64113f79d95",
    "children" : [{
        "_id" : "box-7ae03497ff981319da9df6c2cc071190",
        "key" : "box",
        "values" : {
          "classes" : ["user-panel-light"],
          "isLocked" : true
        },
        "children" : [{
            "_id" : "columns-4ac4cc6c57f47774deafbc2cef13560d",
            "key" : "columns",
            "values" : {
              "classes" : [],
              "collapsed" : false,
              "isLocked" : true
            },
            "children" : [{
                "_id" : "column-1fcf29d3476a59a830e21a76e09af90d",
                "key" : "column",
                "values" : {
                  "classes" : [],
                  "large" : {
                    "width" : 4
                  },
                  "medium" : {
                    "width" : 12
                  },
                  "small" : {
                    "width" : 12
                  },
                  "isEnd" : true,
                  "isLocked" : true
                },
                "children" : [{
                    "_id" : "imageText-951651b5ab283e4c4bb665b823ad435a",
                    "key" : "imageText",
                    "values" : {
                      "classes" : [],
                      "src" : "/img/placeholder.svg",
                      "html" : "Property Title<br>",
                      "isLocked" : false
                    }
                  }
                ]
              }, {
                "_id" : "column-3f40cfb9e10b329c1173061230c3836b",
                "key" : "column",
                "values" : {
                  "classes" : [],
                  "large" : {
                    "width" : 8
                  },
                  "medium" : {
                    "width" : 12
                  },
                  "small" : {
                    "width" : 12
                  },
                  "isEnd" : true,
                  "isLocked" : true
                },
                "children" : [{
                    "_id" : "paragraph-e8dd49a306821a7ea77d400e94c96aca",
                    "key" : "paragraph",
                    "values" : {
                      "classes" : ["user-text-right"],
                      "html" : "<strong class=\"medium-strong\">Location:</strong> xxx<br><strong class=\"medium-strong\">Net Lettable Area (m2):</strong> xxx<br><strong class=\"medium-strong\">Market Value ($m):</strong> xxx<br>",
                      "isLocked" : false
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "values" : {
      "name" : "Portfolio Item",
      "isLocked" : true
    },
    "name" : "Portfolio Item",
    "_id" : "template-62539bcc40c7acfbc018703396e0de9e",
    "_created" : "2015-08-31T03:21:08.510Z",
    "_updated" : "2015-10-06T21:53:02.913Z"
  }
])

const saveFiles = ( files, store ) => {
  return Promise.all( files.map( file => store.saveP( file ) ) )
}

const saveTemplates = ( templates, store ) => Promise.all( templates.map( template => store.saveP( template ) ) )

const setupPages = ( site, store, user ) => {
  const body = {
    'page.name': 'Test Page',
    'page.order': 0,
    'page.parent': site.homePage,
    'page.tags': []
  }

  const api = PageApi( site, store )

  return api.create( user, body )
}

//create a site and store with some images, files, pages and templates
const setupSite = Store => {
  const userModel = { key: 'user', email: 'noreply@example.com', sites: [] }

  const siteModel = {
    "site.name": 'Test Site',
    "site.urls": [ 'example.com' ]
  }

  const logger = Logger( Store, 'tests' )

  const store = Store( 'cms' )
  const stores = Store.stores

  const deps = {
    stores,
    logger
  }

  const session = {}

  const siteApi = SiteApi( Store, deps, session )

  let user

  return store.saveP( userModel )
    .then(
      newUser => {
        user = newUser
      }
    )
    .then(
      () => siteApi.create( user, siteModel )
    )
    .then(
      result => result.data
    )
    .then(
      site => Promise.resolve({
        user, stores, store, site
      })
    )
    .then(
      cmsState =>
        siteApi.getStore( stores, cmsState.site )
          .then(
            siteStore => Object.assign( cmsState, { siteStore } )
          )
    )
    .then(
      cmsState =>
        saveFiles( setupFiles(), cmsState.siteStore )
          .then(
            () => cmsState
          )
    )
    .then(
      cmsState =>
        saveTemplates( setupTemplates(), cmsState.siteStore )
          .then(
            () => cmsState
          )
    )
    .then(
      cmsState =>
        setupPages( cmsState.site, cmsState.siteStore, user )
          .then(
            () => cmsState
          )
    )
}

describe( 'Store API', () => {
  before( () => initDirs() )

  describe( 'Get', () => {
    it( 'should only get whitelisted types, potentially filtered/mapped', () => {
      let storeApi

      //whitelisted types are page, file, image, template
      return setupSite( MemStore.Session() )
        .then(
          cmsState => StoreApi( cmsState.site, cmsState.siteStore )
        )
        .then(
          api => {
            storeApi = api
          }
        )
        .then(
          () => storeApi.get( 'page' )
        )
        .then(
          pages => {
            assert.equal( pages.length, 2 )
            //check mapping
            assert( pages[ 0 ].title )
          }
        )
        .then(
          () => storeApi.get( 'file' )
        )
        .then(
          files =>  {
            assert.equal( files.length, 3 )
            //check mapping
            assert( files[ 0 ].title )
          }
        )
        .then(
          () => storeApi.get( 'image' )
        )
        .then(
          images =>  {
            assert.equal( images.length, 2 )
            //check mapping
            assert( images[ 0 ].title )
          }
        )
        .then(
          () => storeApi.get( 'template' )
        )
        .then(
          templates =>  {
            assert.equal( templates.length, 3 )
          }
        )
        .then(
          () => storeApi.get( 'user' )
        )
        .then(
          users =>  {
            //shouldn't get, not whitelisted
            assert.equal( users.length, 0 )
          }
        )
    })
  })


  describe( 'Load', () => {
    it( 'should only load whitelisted types, potentially filtered/mapped', () => {
      let storeApi
      let cmsState
      let document
      let template

      //whitelisted types are page, file, image, template
      return setupSite( MemStore.Session() )
        .then(
          state => {
            cmsState = state

            return StoreApi( cmsState.site, cmsState.siteStore )
          }
        )
        .then(
          api => {
            storeApi = api
          }
        )
        .then(
          () => cmsState.siteStore.getP( 'document' )
        )
        .then(
          documents => {
            document = documents[ 0 ]
          }
        )
        .then(
          () => storeApi.load( document._id )
        )
        .then(
          doc => assert.equal( document._id, doc._id )
        )
        .then(
          () => cmsState.siteStore.getP( 'template' )
        )
        .then(
          templates => {
            template = templates[ 0 ]
          }
        )
        .then(
          () => storeApi.load( template._id )
        )
        .then(
          templ => assert.equal( template._id, templ._id )
        )
    })
  })

  describe( 'Save', () => {
    it( 'should only save whitelisted types', () => {
      let storeApi
      let cmsState

      //whitelisted types are page, file, image, template
      return setupSite( MemStore.Session() )
        .then(
          state => {
            cmsState = state

            return StoreApi( cmsState.site, cmsState.siteStore )
          }
        )
        .then(
          api => {
            storeApi = api
          }
        )
        .then(
          () => storeApi.save({ _id: 'template-123', key: 'template' })
        )
        .then(
          () => new Promise(
            ( resolve, reject ) => {
              return storeApi.save({ _id: 'user-123', key: 'user' })
                .then(
                  () => reject( new Error( 'Should reject saving non-whitelisted item' ) )
                )
                .catch(
                  err => resolve()
                )
            }
          )
        )
        .then(
          () => new Promise(
            ( resolve, reject ) => {
              return storeApi.save({ _id: 'user-123', key: 'template' })
                .then(
                  () => reject( new Error( 'Should reject key that does not match _id' ) )
                )
                .catch(
                  err => resolve()
                )
            }
          )
        )
    })
  })
})
