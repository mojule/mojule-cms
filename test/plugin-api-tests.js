'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const pluginApi = require( '../src/api/plugin-api' )
const initDirs = require( '../src/init-dirs' )

describe( 'Plugin API', () => {
  before( () => initDirs() )
  
  describe( 'Load', () => {
    it( 'should load plugins', () => {
      return pluginApi.load()
        .then(
          plugins => {
            assert( plugins.length > 0 )
          }
        )
    })
  })   
})
