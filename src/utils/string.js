'use strict'

const stringUtils = {
  /**
   *@function isIdentifier - checks param is string (or number) with chars a-z,A-Z,0-9,-_"
   *optional prefix parm adds check that id prefix matches prefix + '-'
   */
  isIdentifier: val =>
    ( ( typeof val === 'string' || typeof val === 'number' ) &&
      ( String( val ).match( /^[a-z0-9-_]+$/i ) !== null ) ),

  /**
   *@function isDbIdentifier - checks param is string (or number) in form column-5f41981de8de4cb47b8dbdfdf55b3a68 etc.
   */
  isDbIdentifier: ( val, prefix ) => {
    if ( !( ( prefix === undefined ) || ( typeof prefix === 'string' ) ) ) {
      return false
    }
    var result = stringUtils.isIdentifier( val ) && ( val.match( /^[a-z]+-[0-9a-f]{32}$/ ) !== null )
    if ( prefix === undefined ) {
      return result;
    }
    const regex = new RegExp(`^${prefix}-`)
    return  val.match( regex ) !== null
  },
  /**
   *@function isOptDbIdentifier - null or isDbIdentifier.
   */
  isOptDbIdentifier: ( val, prefix ) => {
    if ( val == null ) return true
    return stringUtils.isDbIdentifier( val, prefix )
  },

  /**
   *@function toIdentifier - converts passed param to valid identifier.  If param is invalid throws an exception.  Any param chars not a-z,A-Z,0-9 are converted to - (duplicates removed)
   */
  toIdentifier: val => {
    if ( !( typeof val === 'string' || typeof val === 'number' ) ) {
      throw 'Invalid identifier: ' + String( val )
    }
    const result = String( val ).replace( /[^a-z0-9]/gi, '-' ).toLowerCase().replace( /-{2,}/g, '-' )
    if ( !stringUtils.isIdentifier( result ) ) {
      throw 'Invalid identifier: ' + val
    }
    return ( result )
  }
}

module.exports = stringUtils