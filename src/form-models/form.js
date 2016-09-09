'use strict'

const validator = require( './validator' )

const map = validator.getSchemaMap()

const isReference = obj => validator.validate( obj, 'reference' )

const defaultOptions = {
  submit: true
}

const Form = ( schema, options, obj, errors ) => {
  const form = Object.assign(
    {},
    defaultOptions,
    options,
    ObjectNode( schema, schema.id, false )
  )

  if( obj ){
    addValues( schema, form, obj )
  }

  if( Array.isArray( errors ) && errors.length > 0 ){
    addErrors( schema, form, errors )
  }

  return form
}

const addValues = ( schema, form, obj ) => {
  form.fields.forEach( field => {
    const key = field.name.split( '.' )[ 1 ]

    if( key in obj ){
      if( field.input ){
        if( field.input === 'checkbox' ){
          field.selected = obj[ key ]
        } else {
          field.value = obj[ key ]
        }
      } else if( field.radioGroup && obj[ key ]._id ){
        const selectedId = obj[ key ]._id

        field.radios.forEach( radio => {
          radio.selected = radio.value === selectedId
        })
      } else if( field.selectGroup && obj[ key ]._id ){
        const selectedId = obj[ key ]._id

        field.items.forEach( item => {
          item.selected = item.value === selectedId
        })
      } else if( field.checklist ){
        const selectedIds = obj[ key ].map( ref => ref._id )

        field.items.forEach( item => {
          item.selected = selectedIds.includes( item.value )
        })
      } else if( field.array ){
        field.values = obj[ key ].map(
          value =>
            Object.assign( {}, field.of, { value } )
        )
      } else if( field.textarea ){
        field.value = obj[ key ]
      }
    }
  })
}

const addErrors = ( schema, form, errors ) => {
  errors.forEach( error => {
    const key = error.dataPath.split( '/' )[ 1 ]
    const name = [ schema.id, key ].join( '.' )
    const field = form.fields.find( f => f.name === name )

    if( field ){
      field.error = error.message
    }
  })
}

const Node = ( node, key, required ) => {
  if( !node.type && node.$ref ){
    return handlers.$ref( node, key, required )
  }

  return handlers[ node.type ]( node, key, required )
}

const ObjectNode = ( node, key, required ) => {
  const fields = Object.keys( node.properties ).map( propertyKey => {
    const child = node.properties[ propertyKey ]
    const childKey = [ key, propertyKey ].join( '.' )
    const required = node.required && node.required.includes( propertyKey )

    return Node( child, childKey, required )
  })

  const el = {
    fields,
    name: key
  }

  if( node.title )
    el.title = node.title

  return el
}

const RadioGroupNode = ( node, key, required ) => {
  const radios = node.enum.map( radio =>
    isReference( radio ) ?
      El( { title: radio.name, value: radio._id, selected: !!radio.selected }, key, required ) :
      El( { title: radio, value: radio }, key, required )
  )

  return {
    radioGroup: true,
    radios,
    name: key,
    label: node.description || node.title || '',
    required: !!required
  }
}


const SelectGroupNode = ( node, key, required ) => {
  const items = node.enum.map( item =>
    isReference( item ) ?
      El( { title: item.name, value: item._id, selected: !!item.selected }, key, required ) :
      El( { title: item, value: item }, key, required )
  )

  return {
    selectGroup: true,
    items,
    name: key,
    label: node.description || node.title || '',
    required: !!required
  }
}

const El = ( node, key, required ) => {
  const el = {
    name: key,
    required: !!required
  }

  if( node.value ){
    el.value = node.value
  } else if( node.default || node.default === 0 ){
    el.value = node.default
  }

  if( node.description ){
    el.label = node.description
  } else if( node.title ) {
    el.label = node.title
  }

  if( node.selected ){
    el.selected = true
  }

  if( node.icon ){
    el.icon = node.icon
  }

  return el
}

const InputEl = ( node, key, required, type ) =>
  Object.assign( El( node, key, required ), {
    input: type
  })

const ZipEl = ( node, key, required ) =>
  Object.assign( El( node, key, required ), {
    input: 'file',
    accept: '.zip'
  })

const TextareaNode = ( node, key, required ) =>
  Object.assign( El( node, key, required ), {
    textarea: true
  })

const HiddenNode = ( node, key, required ) => {
  const el = InputEl( node, key, required, 'hidden' )

  delete el.label

  return el
}

const StringNode = ( node, key, required ) => {
  if( Array.isArray( node.enum ) ){
    if( node.format === 'selectlist' ){
      return SelectGroupNode( node, key, required )
    } else if( node.format === 'hidden') {
      return HiddenNode( node, key, required )
    } else if( node.format === 'radiolist' ) {
      return RadioGroupNode( node, key, required )
    }
  }

  if( node.format ){
    if( node.format === 'textarea' )
      return TextareaNode( node, key, required )

    if( node.format === 'hidden' )
      return HiddenNode( node, key, required )

    if( node.format === 'uri' )
      return InputEl( node, key, required, 'url' )

    if( node.format === 'zip-file' )
      return ZipEl( node, key, required )

    return InputEl( node, key, required, node.format )
  }

  return InputEl( node, key, required, 'text' )
}

const BooleanNode = ( node, key, required ) => {
  const field = Object.assign(
    InputEl( node, key, required, 'checkbox' ),
    {
      isCheckbox: true
    }
  )

  if( field.value === true ) field.selected = true

  return field
}

const IntegerNode = ( node, key, required ) => {
  return InputEl( node, key, required, 'number' )
}

const ReferenceNode = ( node, key, required ) => {
  if( node.$ref === 'reference' ){
    if( node.format ){
      if( node.format === 'radiolist' ){
        return RadioGroupNode( node, key, required )
      } else if( node.format === 'selectlist' ){
        return SelectGroupNode( node, key, required )
      } else {
        throw new Error( 'Unexpected format' )
      }
    } else {
      throw new Error( 'No format specified' )
    }
  } else {
    const refNode = map[ node.$ref ]

    if( refNode ){
      return Node( refNode, key, required )
    }

    throw new Error( 'Unexpected $ref' )
  }
}

const ChecklistNode = ( node, key, required ) => {
  const items = Array.isArray( node.enum ) ?
    node.enum.map( item => {
      return isReference( item ) ?
        El( { title: item.name, value: item._id, selected: !!item.selected, icon: item.icon }, key + '[]', required ) :
        //presume string
        El( { title: item, value: item }, key + '[]', required )
    }) : []

  return {
    checklist: true,
    items,
    name: key,
    label: node.description || node.title || '',
    required: !!required
  }
}

const ArrayNode = ( node, key, required ) => {
  if( node.items.$ref === 'reference' && node.format === 'checklist' ){
    return ChecklistNode( Object.assign( {}, node, node.items ), key, required )
  }

  const arrayNode = Object.assign( El( node, key, required ), {
    array: true,
    name: key,
    of: Node( node.items, key + '[]', required )
  })

  if( node.minItems ){
    arrayNode.minItems = node.minItems
  }

  return arrayNode
}

const handlers = {
  array: ArrayNode,
  boolean: BooleanNode,
  integer: IntegerNode,
  number: IntegerNode,
  object: ObjectNode,
  string: StringNode,
  $ref: ReferenceNode
}

module.exports = Form
