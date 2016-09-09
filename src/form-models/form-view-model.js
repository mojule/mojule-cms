'use strict'

const validator = require( './validator' ) 
const DynamicSchema = require( '../dynamic-schema' )
const Form = require( './form' )
const Assemble = require( './assemble' )

const ViewModel = ( baseSchema ) => {
  const dynSchema = DynamicSchema( baseSchema )

  const viewModel = dynamic => {
    const schema = dynSchema.populate( dynamic )
    
    const api = {
      form: ( options, obj, errors ) => 
        Form( schema, options, obj, errors ),
        
      assemble: body => 
        Assemble( schema, body ),
        
      validate: obj => 
        validator.validateMultiple( obj, schema )
    }
    
    return api
  }

  return viewModel
}

module.exports = ViewModel