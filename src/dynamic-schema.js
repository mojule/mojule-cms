'use strict'

const utils = require( './utils/utils' )

const DynamicSchema = schema => {
  const baseSchema = utils.deepClone( schema )
  
  const api = {
    base: () => utils.deepClone( baseSchema ),
    
    populate: obj => {
      const schema = utils.deepClone( baseSchema )
      
      if( obj ){
        Object.keys( obj ).forEach( key => {
          schema.properties[ key ] = utils.deepAssign( schema.properties[ key ], obj[ key ] )
        })
      }
      
      return schema      
    } 
  }
  
  return api
}

module.exports = DynamicSchema
