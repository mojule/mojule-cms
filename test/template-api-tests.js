'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const TemplateApi = require( '../src/api/template-api' )
const MemStore = require( '../dependencies/store/mem-store' )
const initDirs = require( '../src/init-dirs' )

describe( 'Template API', () => {
  before( () => initDirs() )

  describe( 'Create', () => {
    it( 'should create a template from a model', () => {
      const site = {}
      const user = {_id: 'Test User'}
      const store = MemStore( 'cms' )
      const api = TemplateApi( site, store )

      const model = {
        'template.name': 'Test Template',
        'template.tags': []
      }

      return api.create( user, model )
        .then(
          result => {
            assert( result.valid )
          }
        )
    })
  })

  describe( 'Edit', () => {
    it( 'should edit an existing template', () => {
      const site = {}
      const user = {_id: 'Test User'}
      const store = MemStore( 'cms' )
      const api = TemplateApi( site, store )

      const model = {
        'template.name': 'Test Template',
        'template.tags': []
      }

      let template

      return api.create( user, model )
        .then(
          result => {
            template = result.data
          }
        )
        .then(
          () => {
            const editModel = {
              'template.name': 'Edited ' + template.name,
              'template.tags': []
            }

            return api.edit( template, editModel )
          }
        )
        .then(
          result => {
            assert( result.valid )
          }
        )
    })
  })

  describe( 'Default Master', () => {
    it( 'should create and save a master template', () => {
      const site = {}
      const store = MemStore( 'cms' )
      const user = {_id: 'Test User'}
      const api = TemplateApi( site, store )

      return api.defaultMaster( user )
        .then(
          template => assert( template )
        )
    })
  })
})
