'use strict'

const DefaultRenderModels = require( './renderModels' )

const each = ( arr, mapper ) => arr.map( mapper ).join( '' )

const RenderViews = options => {
  const RenderModels = options.RenderModels ? 
    options.RenderModels : DefaultRenderModels

  const models = RenderModels( options )

  const views = {
    preview: ( fn, root, node, model ) => {
      model = models.preview( fn, root, node, model )

      return `<code>${ model.preview }</code>`
    },
    children: ( fn, root, node, model ) => {
      model = models.children( fn, root, node, model )
      
      const { 
        isEmpty, isCollapsed, isChildrenCollapsed, id, title, children, depth
      } = model

      if( isEmpty || isCollapsed ) return ''

      const ifChildrenCollapsed = isChildrenCollapsed ? ' class="collapsed"' : ''

      return `
        <div id="${ id }" data-children${ ifChildrenCollapsed }>
          <header data-toolbar>${ title }</header>
          <ul data-dragsource="composer">${ each( children, child => {
            const childModel = { depth: depth + 1 }
            return  `<li>${ views.node( fn, root, child, childModel ) }</li>`
          })}</ul> 
        </div>`
    },
    main: ( fn, root, node, model ) => {
      model = models.main( fn, root, node, model )
      
      if( model.isCollapsed ) return ''

      return `
        <div data-main>
          <div data-view>${ views.preview( fn, root, node, model ) }</div>
          ${ views.children( fn, root, node, model ) }
        </div>
      `    
    },
    node: ( fn, root, node, model ) => {
      model = models.node( fn, root, node, model )

      const { 
        isCollapsed, isEmpty, id, treeType, depth, title, nodeType
      } = model

      const ifCollapsed = isCollapsed ? ' class="collapsed"' : ''
      const ifEmpty = isEmpty ? ' data-empty' : ''

      return `
        <div id="${ id }" data-${ treeType } data-node="${ nodeType }" data-depth="${ depth }"${ ifCollapsed }${ ifEmpty }>
          <header data-toolbar>${ title }<i data-delete="${ id }" class="fa fa-trash"></i></header>
          ${ views.main( fn, root, node, model ) }
        </div>
      `
    }
  }
  
  return views 
}

module.exports = RenderViews
