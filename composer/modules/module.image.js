var $ = require( '../$' )
var templates = require( '../templates' )
var persistence = require( '../persistence' )
var dialogs = require( '../dialogs' )( $, templates, persistence )

module.exports = {
  name: 'Image Source',
  icon: 'picture-o',
  editor: {
    tab: 'edit',
    groups: {
      'add-image': {
        title: 'Select Image',
        type: 'button',
        template: 'toolbar-icon',
        items: {
          'src': {
            icon: 'folder-open-o',
            title: 'Select'
          },
          'remove': {
            icon: 'trash',
            title: 'Remove Image'
          }
        },
        click: function( item, node, callback, $el, components ){
          var dialogs = require( '../dialogs' )( $, templates, persistence )

          if( item.key === 'src' ){
            dialogs.getValue( 'image', node.values, function( values ){
              if( values && values.src && values.src !== '' ){
                node.values.src = values.src

                if( !Array.isArray( node.values.classes ) ){
                  node.values.classes = []
                }
                if( !node.values.classes.includes( 'clearfix' ) ){
                  node.values.classes.push( 'clearfix' )
                }

                callback( node )
              }
            })

            return
          } else if( item.key === 'remove' ){
            node.values.src = ''

            if( Array.isArray( node.values.classes ) ){
              node.values.classes = node.values.classes.filter( className => className !== 'clearfix' )
            }

            callback( node )
          }

          callback( node )
        }
      },
      'image-size': {
        title: 'Image Height',
        type: 'input',
        template: 'toolbar-number',
        items: {
          height: {
            key: 'height',
            id: 'height',
            title: 'Height',
            min: 1,
            max: 12,
            value: 1
          }
        },
        change: function( item, node, value, callback, $el ){
          node.values.height = value * 1
          callback( node )
        },
        init: function( node, items ){
          items.height.value = node.values.height || 1
        }
      },
      "image-align": {
        title: 'Image Alignment',
        type: 'select-single',
        template: 'toolbar-preview',
        items: {
          left: {
            title: 'Left',
            html: '<i class="fa fa-long-arrow-left"></i>'
          },
          right: {
            title: 'Right',
            html: '<i class="fa fa-long-arrow-right"></i>'
          }
        },
        click: function( item, node, callback ){
          node.values.align = item.key
          callback( node )
        },
        init: function( node, items ){
          var align = node.values.align || 'left'

          Object.keys( items ).forEach( key => {
            items[ key ].selected = key === align
          })
        }
      }
    }
  }
}
