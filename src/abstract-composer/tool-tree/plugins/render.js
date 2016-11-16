'use strict'

const RenderPlugin = require( '../../plugins/renderFactory' )
const RenderViews = require( '../../plugins/renderViews' )
const RenderModels = require( '../../plugins/renderModels' )

const options = {
  RenderModels, treeType: 'toolbar'
}

const models = RenderModels( options )

const each = ( arr, mapper ) => arr.map( mapper ).join( '' )

const toolViews = {
  preview: ( fn, root, node, model ) => {
    model = models.preview( fn, root, node, model )

    if( model.isCollapsed ) return ''

    const value = fn.value( node )
    const { name, icon, dragSource } = value

    const isName = typeof name === 'string'
    const isIcon = typeof icon === 'string'
    const isDragSource = typeof dragSource === 'string'

    const ifDragSource = isDragSource ? 
      dragSource: '' 

    if( isName || isIcon ){
      const ifName = isName ? `<small>${ name }</small>` : ''
      const ifIcon = isIcon ? `<i class="fa fa-2x fa-${ icon }"></i>` : ''

      return `<div class="ratio">
                <div class="shim"></div>                
                <div class="viewport">
                  ${ ifIcon }
                  ${ ifName }
                </div>
              </div>
              ${ ifDragSource }`  
    }

    return ''
  },
  children: ( fn, root, node, model ) => {
    model = models.children( fn, root, node, model )
    
    const { 
      isEmpty, isCollapsed, isChildrenCollapsed, id, children, depth
    } = model

    if( isEmpty || isCollapsed ) return ''

    const ifChildrenCollapsed = isChildrenCollapsed ? ' class="collapsed"' : ''

    return `<div id="${ id }" data-children${ ifChildrenCollapsed }><ul>${ 
      each( children, child => {
        const childModel = { depth: depth + 1 }
        return  `<li>${ views.node( fn, root, child, childModel ) }</li>`
      })
    }</ul></div>`
  },
  main: ( fn, root, node, model ) => {
    model = models.main( fn, root, node, model )

    const preview = views.preview( fn, root, node, model )
    const ifPreview = preview === '' ? 
      '' : `<div data-view>${ preview }</div>`

    return `${ ifPreview }${ views.children( fn, root, node, model ) }`    
  },  
  node: ( fn, root, node, model ) => {
    model = models.node( fn, root, node, model )

    const { 
      isCollapsed, isEmpty, id, treeType, depth, nodeType
    } = model

    const ifCollapsed = isCollapsed ? ' class="collapsed"' : ''
    const ifEmpty = isEmpty ? ' data-empty' : ''

    return `<div id="${ id }" data-${ treeType } data-node="${ nodeType }" data-depth="${ depth }"${ ifCollapsed }${ ifEmpty }>${ 
      views.main( fn, root, node, model ) 
    }</div>`
  }
}

const defaultViews = RenderViews( options )
const views = Object.assign( {}, defaultViews, toolViews )

module.exports = RenderPlugin( views )
