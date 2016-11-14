'use strict'

const createToolPlugin = fn => {
  const nodeTypes = [ 'bar', 'group', 'draggable' ]

  const toolTypes = () => nodeTypes.slice()

  toolTypes.def = {
    argTypes: [],
    returnType: '[string]',
    requires: [],
    categories: [ 'toolTypes', 'plugin' ]
  }

  const create = {
    bar: arg => fn.createNode( { nodeType: 'bar' } ),
    group: arg => {
      let name = 'New Group'
      let icon = 'placeholder'
      let childTypes = [ 'any' ]

      if( arg ){
        if( typeof arg.name === 'string' ) name = arg.name
        if( typeof arg.icon === 'string' ) icon = arg.icon
        if( Array.isArray( arg.childTypes ) ){ 
          childTypes = arg.childTypes
        } else if( typeof arg.childTypes === 'string' ){
          childTypes = [ arg.childTypes ]
        }         
      }

      const nodeType = 'group'
      
      return fn.createNode( { name, icon, nodeType, childTypes } )
    },
    draggable: arg => {
      let name = 'New Draggable'
      let icon = 'placeholder'
      let dragSource = ''

      if( arg ){
        if( typeof arg.name === 'string' ) name = arg.name
        if( typeof arg.icon === 'string' ) icon = arg.icon
        if( typeof arg.dragSource === 'string' ) dragSource = arg.dragSource
      }

      const nodeType = 'draggable'

      return fn.createNode( { name, icon, nodeType, dragSource } )
    }
  }

  const createTool = ( nodeType, arg ) => 
    create[ nodeType ]( arg )

  createTool.def = {
    argTypes: [ 'string', 'any' ],
    returnType: 'node',
    requires: [ 'createNode' ],
    categories: [ 'createTool', 'plugin' ]
  }

  return Object.assign( fn, { toolTypes, createTool } )
}

module.exports = createToolPlugin
