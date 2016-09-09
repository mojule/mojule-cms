'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const UserApi = require( '../src/api/user-api' )
const SiteApi = require( '../src/api/site-api' )
const MemStore = require( '../dependencies/store/mem-store' )
const Logger = require( '../src/bunyan-logger' )
const emailer = require( '../dependencies/email/mem-email' )
const initDirs = require( '../src/init-dirs' )

const logger = Logger( MemStore, 'tests' )

describe( 'User API', () => {
  before( () => initDirs() )

  describe( 'Init', () => {
    it( 'should setup the master users', () => {
      const store = MemStore( 'cms' )
      const api = UserApi( store, emailer )

      let length

      return api.init()
        .then(
          users => {
            length = users.length

            assert( length > 0 )
          }
        )
        //ensure only creates master first time
        .then(
          () => api.init()
        )
        .then(
          () => store.getP( 'user' )
        )
        .then(
          users => assert.equal( users.length, length )
        )
    })
  })

  describe( 'Create', () => {
    it( 'should create a user from a model', () => {
      const Store = MemStore.Session()

      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const siteApi = SiteApi( Store, deps, session )

      const api = UserApi( store, emailer )

      let creator
      let length

      const body = {
        'user.name': 'New User',
        'user.email': 'create@example.com'
      }

      const siteBody = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      return api.init()
        .then(
          users => {
            creator = users[ 0 ]
            length = users.length
          }
        )
        .then(
          () => siteApi.create( creator, siteBody )
        )
        .then(
          result => {
            const site = result.data
            body[ 'user.sites' ] = [ site._id ]
          }
        )
        .then(
          () => api.create( creator, body )
        )
        .then(
          result => {
            assert( result.valid )
          }
        )
        .then(
          () => store.getP( 'user' )
        )
        .then(
          users => {
            assert.equal( users.length, length + 1 )

            const email = emailer.outbox.find( sent => sent.to === body[ 'user.email'] )

            assert( email )
          }
        )
    })
  })

  describe( 'Edit', () => {
    it( 'should edit an existing user', () => {
      const Store = MemStore.Session()

      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const siteApi = SiteApi( Store, deps, session )

      const api = UserApi( store, emailer )

      let creator
      let user

      const body = {
        'user.name': 'New User',
        'user.email': 'edit@example.com'
      }

      const siteBody = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      return api.init()
        .then(
          users => {
            creator = users[ 0 ]
          }
        )
        .then(
          () => siteApi.create( creator, siteBody )
        )
        .then(
          result => {
            const site = result.data
            body[ 'user.sites' ] = [ site._id ]
          }
        )
        .then(
          () => api.create( creator, body )
        )
        .then(
          result => {
            user = result.data
          }
        )
        .then(
          () => {
            const editBody = {
              'user.name': 'Edited ' + user.name,
              'user.email': user.email,
              'user.sites': user.sites.map( s => s._id )
            }

            return api.edit( creator, user, editBody )
          }
        )
        .then(
          result => {
            assert( result.valid )
            assert.equal( result.data.name, 'Edited New User' )
          }
        )
    })
  })

  describe( 'Get Sites', () => {
    it( 'should get the sites for a user', () => {
      const Store = MemStore.Session()

      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const siteApi = SiteApi( Store, deps, session )

      const api = UserApi( store, emailer )

      let creator
      let user

      const body = {
        'user.name': 'New User',
        'user.email': 'getsites@example.com'
      }

      const siteBody = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      const siteBody2 = {
        "site.name": 'Other Test Site',
        "site.urls": [ 'example.net' ]
      }

      const siteBody3 = {
        "site.name": 'Yet Another Test Site',
        "site.urls": [ 'example.org' ]
      }

      return api.init()
        .then(
          users => {
            creator = users[ 0 ]
          }
        )
        .then(
          () => siteApi.create( creator, siteBody )
        )
        .then(
          () => siteApi.create( creator, siteBody2 )
        )
        .then(
          result => {
            const site = result.data
            body[ 'user.sites' ] = [ site._id ]
          }
        )
        .then(
          () => api.create( creator, body )
        )
        .then(
          result => {
            user = result.data
          }
        )
        .then(
          () => siteApi.create( user, siteBody3 )
        )
        .then(
          () => api.getSites( creator )
        )
        .then(
          sites => {
            //master user - should have all 3
            assert.equal( sites.length, 3 )
          }
        )
        .then(
          () => api.getSites( user )
        )
        .then(
          sites => {
            //user - should have 2
            assert.equal( sites.length, 2 )
          }
        )
    })
  })

  describe( 'Verify User', () => {
    it( 'Should verify a user password', () => {
      const Store = MemStore.Session()

      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const siteApi = SiteApi( Store, deps, session )

      const api = UserApi( store, emailer )

      let creator
      let user

      const body = {
        'user.name': 'New User',
        'user.email': 'verify@example.com'
      }

      const siteBody = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      return api.init()
        .then(
          users => {
            creator = users[ 0 ]
          }
        )
        .then(
          () => siteApi.create( creator, siteBody )
        )
        .then(
          result => {
            const site = result.data
            body[ 'user.sites' ] = [ site._id ]
          }
        )
        .then(
          () => api.create( creator, body )
        )
        .then(
          result => {
            user = result.data
          }
        )
        .then(
          () => {
            const email = emailer.outbox.find( sent => sent.to === body[ 'user.email'] )
            const passwordRegex = /\n(.{10})/
            const matches = email.text.match( passwordRegex )
            const password = matches[ 1 ].trim()

            return api.verify( user, password )
          }
        )
        .then(
          verified => assert( verified )
        )
    })
  })

  describe( 'Reset Password', () => {
    it( 'Should generate a token and email to reset password', () => {
      const Store = MemStore.Session()

      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const siteApi = SiteApi( Store, deps, session )

      const api = UserApi( store, emailer )

      let creator
      let user
      let token

      const body = {
        'user.name': 'New User',
        'user.email': 'reset@example.com'
      }

      const siteBody = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      return api.init()
        .then(
          users => {
            creator = users[ 0 ]
          }
        )
        .then(
          () => siteApi.create( creator, siteBody )
        )
        .then(
          result => {
            const site = result.data
            body[ 'user.sites' ] = [ site._id ]
          }
        )
        .then(
          () => api.create( creator, body )
        )
        .then(
          result => {
            user = result.data
          }
        )
        .then(
          () => api.resetPassword( user.email, 'http://example.com' )
        )
        .then(
          () => {
            const email = emailer.outbox.find( email => email.to === user.email )
            token = email.text.split( '=' )[ 1 ]
          }
        )
        .then(
          () => store.getP( 'token' )
        )
        .then(
          tokens => {
            assert.equal( tokens.length, 1 )

            const token = tokens[ 0 ]

            assert.equal( token.user, user._id )
            assert.equal( token.email, user.email )
          }
        )
    })
  })

  describe( 'Change Password', () => {
    it( 'Should change a user password and tidy up afterwards', () => {
      const Store = MemStore.Session()

      const store = Store( 'cms' )

      const deps = {
        stores: {
          cms: store
        },
        logger
      }

      const session = {}

      const siteApi = SiteApi( Store, deps, session )

      const api = UserApi( store, emailer )

      let creator
      let user
      let token

      const body = {
        'user.name': 'New User',
        'user.email': 'change@example.com'
      }

      const siteBody = {
        "site.name": 'Test Site',
        "site.urls": [ 'example.com' ]
      }

      return api.init()
        .then(
          users => {
            creator = users[ 0 ]
          }
        )
        .then(
          () => siteApi.create( creator, siteBody )
        )
        .then(
          result => {
            const site = result.data
            body[ 'user.sites' ] = [ site._id ]
          }
        )
        .then(
          () => api.create( creator, body )
        )
        .then(
          result => {
            user = result.data
          }
        )
        .then(
          () => api.resetPassword( user.email, 'http://example.com' )
        )
        .then(
          () => {
            const email = emailer.outbox.find( email => email.to === user.email )
            token = email.text.split( '=' )[ 1 ]
          }
        )
        .then(
          () => store.getP( 'token' )
        )
        .then(
          tokens => {
            token = tokens[ 0 ]
          }
        )
        .then(
          () => {
            api.changePassword( token._id, 'password' )
          }
        )
        .then(
          () => store.loadP( user._id )
        )
        .then(
          loadedUser => {
            user = loadedUser
          }
        )
        .then(
          () => api.verify( user, 'password' )
        )
        //assert new password
        .then(
          isVerified => assert( isVerified )
        )
        .then(
          () => store.getP( 'token' )
        )
        .then(
          tokens => {
            //assert token cleared
            assert.equal( tokens.length, 0 )
          }
        )
    })
  })

})
