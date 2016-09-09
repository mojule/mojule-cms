'use strict'

const assert = require( 'assert' )
const stringUtils = require( '../src/utils/string' )
const httpStatusUtils = require( '../src/utils/httpStatus' )
const randomUtils = require( '../src/utils/random' )

describe( 'stringUtils Tests', () => {
  describe( 'isIdentifier', () => {
    it( 'should test valid identifier values', () => {
      assert( stringUtils.isIdentifier( '1234' ) )
      assert( stringUtils.isIdentifier( 1234 ) )
      assert( stringUtils.isIdentifier( '0' ) )
      assert( stringUtils.isIdentifier( 0 ) )
      assert( stringUtils.isIdentifier( 'Abcd-af3d7c_test' ) )
    })
    it( 'should test invalid identifier values', () => {
      assert.ifError( stringUtils.isIdentifier( null ) )
      assert.ifError( stringUtils.isIdentifier( true ) )
      assert.ifError( stringUtils.isIdentifier( '' ) )
      assert.ifError( stringUtils.isIdentifier( 'Abcd-af3d7c+test' ) )
    })
  })
  describe( 'isDbIdentifier', () => {
    it( 'should test valid database identifier values', () => {
      assert( stringUtils.isDbIdentifier( 'columns-c47d055a6a3e1ca8ac929fbb21e40d40' ) )
      assert( stringUtils.isDbIdentifier( 'columns-c47d055a6a3e1ca8ac929fbb21e40d40', 'columns' ) )
      assert( stringUtils.isDbIdentifier( 'x-c47d055a6a3e1ca8ac929fbb21e40d40' ) )
    })
    it( 'should test invalid database identifier values', () => {
      assert.ifError( stringUtils.isDbIdentifier( 'columns-c47d055a6a3e1ca8ac929fbb21e40d40', 123 ) )
      assert.ifError( stringUtils.isDbIdentifier( 'c47d055a6a3e1ca8ac929fbb21e40d40' ) )
      assert.ifError( stringUtils.isDbIdentifier( '-c47d055a6a3e1ca8ac929fbb21e40d40' ) )
      assert.ifError( stringUtils.isDbIdentifier( 'columns-c47d055a6a3e1ca8ac929fbb21e40d40a' ) )
      assert.ifError( stringUtils.isDbIdentifier( 'columns-c47d' ) )
    })
  })
  describe( 'isOptDbIdentifier', () => {
    it( 'should test valid optional database identifier values', () => {
      assert( stringUtils.isOptDbIdentifier( null ) )
      assert( stringUtils.isOptDbIdentifier( 'columns-c47d055a6a3e1ca8ac929fbb21e40d40' ) )
      assert( stringUtils.isOptDbIdentifier( 'x-c47d055a6a3e1ca8ac929fbb21e40d40' ) )
    })
    it( 'should test invalid optional database identifier values', () => {
      assert.ifError( stringUtils.isOptDbIdentifier( 'c47d055a6a3e1ca8ac929fbb21e40d40' ) )
    })
  })
  describe( 'toIdentifier', () => {
    it( 'should convert values to valid identifiers', () => {
      assert.equal( stringUtils.toIdentifier( 'abcd' ), 'abcd' )
      assert.equal( stringUtils.toIdentifier(( new Date( '2016-05-04' ) ).toJSON() ), '2016-05-04t00-00-00-000z' )
      assert.equal( stringUtils.toIdentifier( 'Trade Login' ), 'trade-login' )
      assert.equal( stringUtils.toIdentifier( 'Haddock+)))*&^-1234--A' ), 'haddock-1234-a' )
    })
    it( 'should test fails to convert values to valid identifiers', () => {
      assert.throws(() => ( stringUtils.toIdentifier( null ) ) )
      assert.throws(() => ( stringUtils.toIdentifier( '' ) ) )
      assert.throws(() => ( stringUtils.toIdentifier( true ) ) )
    })
  })

})

describe( 'randomUtils Tests', () => {
  describe( 'randomHex', () => {
    it( 'should create random hex strings of specified length', () => {
      const hexLen = 16
      let hexStr1 = randomUtils.randomHex( hexLen)
      let hexStr2 = randomUtils.randomHex( hexLen)
      assert.equal( hexStr1.length, hexLen )
      assert.equal( hexStr2.length, hexLen )
      assert.ifError( hexStr1 === hexStr2 )
    })
  })
  describe( 'randomId', () => {
    it( 'should create legal ids', () => {
      const prefix = 'donkey'
      let id1 = randomUtils.randomId( prefix )
      assert( stringUtils.isDbIdentifier( id1, prefix ) )
    })
  })
})


describe( 'httpStatusUtils Tests', () => {
  describe( 'extendMessage', () => {
    it( 'should create a message from http status and args', () => {
      const status = httpStatusUtils.httpStatus._400BadRequest
      let statusStr = status.toFormat(  )
      assert.equal( statusStr, '400 - Bad Request' )
      statusStr = status.toFormat( 'a', 'b', 'c' )
      assert.equal( statusStr, '400 - Bad Request: a,b,c' )
    })
  })
})
