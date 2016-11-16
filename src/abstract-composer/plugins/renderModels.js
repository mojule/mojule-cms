'use strict'

const escapeGt = str => str.replace( /</g, '&lt;' )
const escapeNewline = str => str.replace( /\r/g, '\\r' ).replace( /\n/g, '\\n' )

const RenderModels = options => {
  const models = {
    preview: ( fn, root, node, model ) => {
      const indent = model && model.indent ? model.indent : null

      return Object.assign( {}, model, {
        preview: escapeGt( JSON.stringify( fn.value( node ), null, indent ) )
      })
    },
    children: ( fn, root, node, model ) => model,
    main: ( fn, root, node, model ) => {
      const { depth, id } = model

      return Object.assign( {}, model, {
        id: 'children-' + id,
        title: `${ depth }: children`
      })
    },
    node: ( fn, root, node, model ) => {
      model = model || {}
      model.depth = model.depth || 0

      const { depth } = model 

      const children = fn.getChildren( node )
      const value = fn.value( node )
      const id = fn.id( fn, node )

      let isCollapsed = fn.meta( fn, node, 'isCollapsed' ) 
      
      isCollapsed = typeof isCollapsed === 'boolean' ? isCollapsed : depth > 0      

      let isChildrenCollapsed = isCollapsed || fn.meta( fn, node, 'isChildrenCollapsed' ) || false

      const isEmpty = fn.empty( fn, node )
      
      const name = typeof value.name === 'string' ? value.name : ''
      
      const nodeType = [ value.nodeType, value.type, 'node' ].find( s => 
        typeof s === 'string' 
      )

      const treeType = options.treeType || 'composer'
      const titleText = name + ' ' + nodeType
      const childCount = children.length ? ` [ ${ children.length } ]` : ''
      const data = value.data ? ` "${ escapeNewline( value.data ) }"` : ''
      const title = model.nodeTitle || depth + ': ' + titleText + childCount + data

      const nodeModel = Object.assign( 
        {}, 
        model, 
        { 
          isCollapsed, isChildrenCollapsed, isEmpty, children, depth, id, 
          treeType, title, nodeType
        }
      )

      return nodeModel
    }
  }
  
  return models 
}

module.exports = RenderModels
