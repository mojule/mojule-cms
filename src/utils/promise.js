'use strict'

const eachPromise = ( promises, state ) => {
  if( promises.length ){
    const next = promises.shift()

    // items are a function that 1) returns a promise 2) has a property named key
    return next( state ).then( value => {
      state[ next.key ] = value

      return eachPromise( promises, state )
    })
  }

  return state
}

const promiseCollect = ( collection, state ) => {
  // take the function and give it a property 'key' that it will use to decorate
  // the state
  const items = Object.keys( collection ).map( key =>
    Object.assign( collection[ key ], { key } )
  )

  return eachPromise( items, state || {} )
}

/**
 * @function promiseFilter -
 * @returns - promise resolving to filtered items from original array.
 * @param arr - array of anything
 * @param predicate - a function taking a single arg and returning bool.
 */
const promiseFilter = ( arr, predicate ) =>
  Promise.all(
    arr.map(
      ( element, index ) =>
        predicate( element, index, arr )
    )
  ).then(
    result =>
      arr.filter(
        ( element, index ) =>
          result[ index ]
      )
  )

module.exports =  { promiseCollect, promiseFilter }
