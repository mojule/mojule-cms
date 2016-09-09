const Components = require( './components' )
const utils = require( '../src/utils/utils' )

const ComponentApi = ( $, templates, persistence, components, options ) => {
  const isContainer = key => components[ key ] && components[ key ].accepts

  const isVertical = key => components[ key ] && components[ key ].isVertical

  const isNonEmptyDropzone = key => components[ key ] && components[ key ].isNonEmptyDropzone

  const canContain = ( parentKey, childKey ) => {
    if( components[ parentKey ] && components[ childKey ] && isContainer( parentKey ) ){
      return components[ parentKey ].accepts === '*' || components[ parentKey ].accepts.includes( childKey )
    }

    return false
  }

  const canBeParent = ( parentKey, childKey ) => {
    if( !canContain( parentKey, childKey ) ) return false

    if( !components[ childKey ].parents ) return true

    if( components[ childKey ].parents === '*' ) return true

    return components[ childKey ].parents.includes( parentKey )
  }

  const canPlace = ( parentKey, childKey ) => canContain( parentKey, childKey ) &&
    canBeParent( parentKey, childKey )

  const onAdd = ( root, node, callback ) => {
    if( components[ node.key ] && components[ node.key ].onAdd ){
      components[ node.key ].onAdd( root, node, callback )
    }
  }

  const onChanged = ( root, node ) => {
    if( components[ node.key ] && components[ node.key ].onChanged ){
      components[ node.key ].onChanged( root, node )
    }
  }

  const headerText = node => {
    if( components[ node.key ] ){
      if( components[ node.key ].headerText )
        return components[ node.key ].headerText( node )

      if( components[ node.key ].name )
        return components[ node.key ].name
    }

    return 'Unknown Component'
  }

  const editor = node => components[ node.key ].editor

  const createNode = ( key, parentKey ) => {
    const node = {
      _id: utils.randomId( key ),
      key: key,
      values: Object.assign(
        {
          classes: []
        },
        utils.deepClone( components[ key ].values || {} )
      )
    }

    if( isContainer( key ) )
      node.children = []

    if( parentKey )
      return wrapNode( node, parentKey )

    return node
  }

  const wrapNode = ( node, parentKey ) => {
    if( components[ parentKey ] && components[ parentKey ].wrap ){
      const wrapperKey = components[ parentKey ].wrap

      if( wrapperKey !== node.key ){
        const wrappedNode = createNode( wrapperKey )

        wrappedNode.children.push( node )

        return wrappedNode
      }
    }

    return node
  }

  const nodeToEl = node => {
    const values = Object.assign(
      {
        classes: []
      },
      node.values,
      {
        _id: node._id,
        children: node.children
      }
    )

    const template = templates[ node.template ] || templates[ node.key ]

    const $el = template( values )

    values.classes.forEach( className => {
      $el.addClass( className )
    })

    if( node._id ){
      $el.attr( 'data-node', node._id )
    }

    return $el
  }

  const addChildrenSync = ( node, $el ) => {
    const $container = $el.is( '[data-container] ' ) ? $el : $el.find( '[data-container]' ).first()

    if( $container.length && node.children && node.children.length ){
      node.children.forEach( child => {
        $container.append( toElSync( child ) )
      })
    }

    return $el
  }

  const addChildren = ( node, $el, callback ) => {
    const $container = $el.is( '[data-container] ' ) ? $el : $el.find( '[data-container]' ).first()

    if( $container.length > 0 && node.children && node.children.length > 0 ){
      function addChild( children ){
        if( children.length === 0 ){
          callback( $el )
          return
        }

        var child = children.shift()
        toEl( child, false, function( $child ){
          $container.append( $child )
          addChild( children )
        })
      }

      addChild( node.children.slice( 0 ) )

      return
    }

    callback( $el )
  }

  const toElSync = ( node, withoutChildren ) => {
    const $el = nodeToEl( node )

    const component = components[ node.key ]

    if( component.render ){
      component.render( components, node, $el, false, options )

      return $el
    }

    if( withoutChildren ) return $el

    return addChildrenSync( node, $el )
  }

  const toEl = ( node, withoutChildren, callback ) => {
    if( !callback ) return toElSync( node, withoutChildren )

    const $el = nodeToEl( node )

    const component = components[ node.key ]

    if( component.render ){
      component.render( components, node, $el, callback, options)
      return
    }

    if( withoutChildren ){
      callback( $el )
      return
    }

    addChildren( node, $el, callback )
  }

  const Events = modules => {
    const onCreatingEl = node => {
      const component = components[ node.key ]

      if( component.onCreating )
        component.onCreating( node, components, modules )

      if( component.modules ){
        Object.keys( component.modules ).forEach( key => {
          if( modules[ key ].onCreating )
            modules[ key ].onCreating( node, components, modules )
        })
      }
    }

    const onCreateEl = ( node, $el, selectById ) => {
      const component = components[ node.key ]

      if( component.onCreate )
        component.onCreate( node, $el, selectById )

      if( component.modules ){
        Object.keys( component.modules ).forEach( key => {
          if( modules[ key ].onCreate )
            modules[ key ].onCreate( node, $el, selectById )
        })
      }
    }

    const onCreatedEl = ( node, $el, selectById ) => {
      const component = components[ node.key ]

      if( component.onCreated )
        component.onCreated( node, $el, selectById )

      if( component.modules ){
        Object.keys( component.modules ).forEach( key => {
          if( modules[ key ].onCreated )
            modules[ key ].onCreated( node, $el, selectById )
        })
      }
    }

    const onBeforeElToNode = ( node, $el ) => {
      const component = components[ node.key ]

      if( component.onBeforeElToNode )
        component.onBeforeElToNode( node, $el )

      if( component.modules ){
        Object.keys( component.modules ).forEach( key => {
          if( modules[ key ].onBeforeElToNode )
            modules[ key ].onBeforeElToNode( node, $el )
        })
      }
    }

    const events = {
      onCreatingEl,
      onCreateEl,
      onCreatedEl,
      onBeforeElToNode
    }

    return events
  }

  const api = {
    isContainer,
    isVertical,
    isNonEmptyDropzone,
    canBeParent,
    canPlace,
    onAdd,
    onChanged,
    headerText,
    editor,
    createNode,
    wrapNode,
    nodeToEl,
    addChildrenSync,
    addChildren,
    toElSync,
    toEl,
    Events
  }

  return api
}

module.exports = ComponentApi
