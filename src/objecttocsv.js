'use strict'
/**
 * @module objecttocsv
 * Functions to convert cms objects to csv data
 */

const delim = ','
const newLine = '\n'
const quote = '"'
const quoteReplace = '\''

const isContainsDelim = ( value ) => {
  const regex = new RegExp( `${delim}` )
  return ( value.match( regex ) !== null )
}

const isContainsQuote = ( value ) => {
  const regex = new RegExp( `${quote}` )
  return ( value.match( regex ) !== null )
}

const replaceQuote = ( value ) => {
  const regex = new RegExp( `${quote}`, 'g' )
  return value.replace( regex, quoteReplace )
}

/**
 * @function - converts passed objects to csv string.  Object are separated by new lines.
 * @param objects - one or more objects to be converted to csv
 * @param exclude - one or more object property names to be excluded from csv line for object
 * @param headings - true if line of column headings prepend the object csv data
 * @returns - string with heading line then object properties separated by delim and newline
 */
const objectToCsv = ( objects, exclude, headings ) => {
  //console.log( typeof objects )
  // Check parm objects
  if ( typeof objects === 'undefined' ) {
    return ( typeof objects )
  }
  if ( typeof objects !== 'object' ) {
    return objects.toString()
  }
  if ( objects === null ) {
    return 'null'
  }

  objects = [].concat( objects )
  let isExcludes = false;
  //console.log( typeof exclude )
  if ( ( typeof exclude !== 'undefined' ) && ( typeof exclude !== 'null' ) ) {
    isExcludes = true
    exclude = [].concat( exclude )
  }
  //console.log( exclude )

  const isExcluded = ( property ) => {
    //console.log( property)
    return exclude.indexOf( property ) < 0
  }

  let includeKeys
  if ( isExcludes ) {
    includeKeys = Object.keys( objects[0] ).filter( p => isExcluded( p ) )
  }
  else {
    includeKeys = Object.keys( objects[0] )
  }
  // let includeKeys = Object.keys( objects[0] )

  const colHeadings = includeKeys.reduce(( pv, cv, i, ary ) => ( pv + cv + delim ), '' ).slice( 0, -1 )

  const objToCsv = ( object ) => {
    let result = ''
    for ( let key of includeKeys ) {
      if( object[ key ] || object[ key ] === false ){
        let value = object[key].toString()
        if ( ( isContainsDelim( value ) ) || ( isContainsQuote( value ) ) ) {
          if ( isContainsQuote( value ) ) {
            value = replaceQuote( value )
          }
          value = quote + value + quote
        }
        result = result + value + delim
      } else {
        result += delim
      }
    }
    return result.slice( 0, -1 )
  }


  let lines = []
  if ( headings ) {
    lines.push( colHeadings )
  }
  for ( let obj of objects ) {
    lines.push( objToCsv( obj ) )
  }

  const result = lines.reduce(( pv, cv, i, ary ) => ( pv + cv + newLine ), '' )

  return result
}



module.exports = objectToCsv