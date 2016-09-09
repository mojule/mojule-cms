'use strict'

require( '../polyfills' )

const assert = require( 'assert' )
const Store = require( '../dependencies/store/mem-store' )
const initDirs = require( '../src/init-dirs' )

const getTestData = () => {
  return [
    {
      name: 'Nik',
      key: 'Person'
    },
    {
      name: 'Andy',
      key: 'Person'
    },
    {
      name: 'Denis',
      key: 'Person'
    },
    {
      name: 'Spot',
      key: 'Dog'
    }
  ]
}

const setupStore = store =>
  Promise.all( getTestData().map( person => store.saveP( person ) ) )

describe( 'Memory Store', () => {
  before( () => initDirs() )

  describe( 'Save', () => {
    it( 'should save a single object', () => {
      const store = Store( 'test' )
      const data = getTestData()

      return store.saveP( data[ 0 ] )
        .then(
          savedObj => {
            assert( savedObj._id.length )
            assert.equal( savedObj.name, 'Nik' )
            assert.equal( savedObj.key, 'Person' )
          }
        )
    })
  })

  describe( 'Load', () => {
    it( 'should load a single object', () => {
      const store = Store( 'test' )
      const data = getTestData()

      return store.saveP( data[ 0 ] )
        .then(
          savedPerson => savedPerson._id
        )
        .then(
          id => store.loadP( id )
        )
        .then(
          loadedObj => {
            assert( loadedObj._id.length )
            assert.equal( loadedObj.name, 'Nik' )
            assert.equal( loadedObj.key, 'Person' )
          }
        )
    })

    it( 'should load multiple objects', () => {
      const store = Store( 'test' )
      const data = getTestData()

      return setupStore( store )
        .then(
          savedItems => savedItems.map( item => item._id )
        )
        .then(
          ids => store.loadP( ids )
        )
        .then(
          loaded => {
            assert.equal( loaded.length, data.length )
          }
        )
    })
  })

  describe( 'Get', () => {
    it( 'should get all objects for a given key', () => {
      const store = Store( 'test' )
      const data = getTestData()

      return setupStore( store )
        .then(
          () => store.getP( 'Person' )
        )
        .then(
          people => {
            assert.equal( people.length, 3 )
          }
        )
    })
  })

  describe( 'All', () => {
    it( 'should get all objects in the store', () => {
      const store = Store( 'test' )
      const data = getTestData()

      return setupStore( store )
        .then(
          items => {
            assert.equal( items.length, 4 )
          }
        )
    })
  })

  describe( 'Remove', () => {
    it( 'should remove a single object', () => {
      const store = Store( 'test' )
      const data = getTestData()

      return setupStore( store )
        .then(
          items => store.removeP( items[ 0 ]._id )
        )
        .then(
          () => store.allP()
        )
        .then(
          items => {
            assert.equal( items.length, 3 )
          }
        )
    })
  })
})
