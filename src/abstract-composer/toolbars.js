'use strict'

const morphdom = require( 'morphdom' )
const hinfo = require( 'hinfo' )
const ToolTree = require( './tool-tree' )

const div = () => ({
  "type": "tag",
  "name": "div",
  "attr": {}
})

const text = () => ({
  "type": "text",
  "data": "abc"
})

const Toolbars = options => {
  const { composer } = options

  const ctree = composer.tree()
  const idMap = composer.idMap()

  const draggableMap = new Map()

  const createDraggable = ( value, sourceValue ) => {
    const cleanValue = JSON.parse( JSON.stringify( value ) )
    const cleanSourceValue = JSON.parse( JSON.stringify( sourceValue ) )
    
    const container = ctree.createNode( div() )  
    const source = ctree.createNode( sourceValue )

    idMap.set( container.id(), container )
    idMap.set( source.id(), source )

    container.append( source )

    const dragSource = container.render()

    const draggable = toolTree.createTool( 
      'draggable', Object.assign( {}, value, { dragSource } )
    )
    
    draggableMap.set( source.id(), draggable )

    draggable.meta( 'value', cleanValue )
    draggable.meta( 'sourceValue', cleanSourceValue )
    draggable.meta( 'containerId', container.id() )

    return draggable
  }

  const toolTree = ToolTree(  { value: { nodeType: 'bar' }, children: [] } )

  const draggables = toolTree.createTool( 'group', { name: 'Add New', icon: 'plus-circle', childTypes: [ 'draggable' ] } )
  
  toolTree.append( draggables )

  const newDiv = createDraggable({ 
    name: 'DIV', 
    icon: 'square-o'
  }, div() )

  const newText = createDraggable({ 
    name: 'Text Node', 
    icon: 'font'
  }, text() )

  draggables.append( newDiv )
  draggables.append( newText )

  toolTree.walk( n => n.meta( 'isCollapsed', false ) )

  const dropHandler = 
    ( node, parentNode, el, containerEl, sourceContainerEl, nextEl ) => {            
      const draggable = draggableMap.get( node.id() )

      if( !draggable ) return
      
      const draggableEl = document.getElementById( draggable.id() )
      
      const value = draggable.meta( 'value' ) 
      const sourceValue = draggable.meta( 'sourceValue' )
      const containerId = draggable.meta( 'containerId' )

      idMap.delete( containerId )

      const newDraggable = createDraggable( value, sourceValue )
      
      morphdom( draggableEl, newDraggable.render() )

      draggableMap.delete( node.id() )
    }

  composer.dropHandler( dropHandler )

  const api = {
    tree: () => toolTree
  } 

  return api
} 

module.exports = Toolbars
