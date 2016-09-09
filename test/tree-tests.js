'use strict'

const assert = require( 'assert' )
const Tree = require( '../src/tree' )

const testData = () => ({
  id: 'grandparent',
  age: 65,
  children: [
    {
      id: 'parent 1',
      age: 45
    },
    {
      id: 'parent 2',
      age: 37,
      children: [
        {
          id: 'child 1',
          age: 14
        },
        {
          id: 'child 2',
          age: 9
        },
        {
          id: 'child 3',
          age: 24
        }
      ]
    },
    {
      id: 'parent 3',
      age: 25,
      children: [
        {
          id: 'child 4',
          age: 3
        },
        {
          id: 'child 5',
          age: 4
        }
      ]
    }
  ]
})

describe( 'Tree Tests', () => {
  describe( 'walk', () => {
    it( 'should walk a tree', () => {
      const root = testData()
      const tree = Tree( root )

      let count = 0

      tree.walk( root, node => {
        count++
      }, 0 )

      assert.equal( count, 9 )
    })
  })

  describe( 'find', () => {
    it( 'should find a single node', () =>{
      const root = testData()
      const tree = Tree( root )

      const child3 = tree.find( node => node.age === 24 )

      assert( child3 !== undefined )
      assert.equal( child3.id, 'child 3' )
    })
  })

  describe( 'findAll', () => {
    it( 'should find all matching nodes', () =>{
      const root = testData()
      const tree = Tree( root )

      const children = tree.findAll( node => node.age < 18 )

      assert( Array.isArray( children ) )
      assert.equal( children.length, 4 )
    })
  })

  describe( 'parent', () => {
    it( 'should find the parent of a node', () =>{
      const root = testData()
      const tree = Tree( root )

      const child3 = tree.find( node => node.age === 24 )

      const parent = tree.parent( child3 )

      assert( parent !== undefined )
      assert.equal( parent.id, 'parent 2' )
    })
  })
})
