'use strict'

const RenderPluginFactory = views => {
  const renderPlugin = fn => {
    const render = ( fn, root, node, viewName, model ) => {            
      viewName = viewName || 'node'
      
      return views[ viewName ]( fn, root, node, model )
    }

    render.def = {
      argTypes: [ 'fn', 'rootNode', 'node', 'string', 'any' ],
      returnType: 'string',
      requires: [ 'value', 'getChildren', 'empty', 'id', 'meta' ],
      categories: [ 'render', 'plugin' ]
    }

    return Object.assign( fn, { render } )
  }

  return renderPlugin
}

module.exports = RenderPluginFactory
