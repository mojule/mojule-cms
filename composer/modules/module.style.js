var $ = require( '../$' )
var templates = require( '../templates' )
var persistence = require( '../persistence' );
var styles = require( '../styles' )

var style = {
  name: 'Style',
  icon: 'paint-brush',
  onCreate: function( node, $el, selectById ){
    var items = style.editor.groups.classes.items;

    var classes = styles.getClasses( window.document );

    classes.forEach( function( className ){
      if( !items[ className ] ){
        var title = className.split( 'user-' )[ 1 ];
        items[ className ] = {
          key: className,
          title: title,
          html: '',
          selected: false
        }
      }
    });
  },
  onDeselect: function( node, $el ){
  },
  editor: {
    tab: 'edit',
    groups: {
      'classes': {
        title: 'Classes',
        type: 'select-multiple',
        template: 'toolbar-preview',
        items: {},
        click: function( item, node, callback, $el ){
          item.selected = !item.selected;

          var className = item.key;

          if( !Array.isArray( node.values.classes ) ) node.values.classes = []

          if( item.selected ){
            node.values.classes.push( className );
          } else {
            node.values.classes = node.values.classes.filter( c => c !== className )
          }

          callback( node )
        },
        init: function( node, items, components ){
          const api = require( '../component-api' )( $, templates, persistence, components )

          var classes = styles.getClasses( window.document );
          classes.forEach( function( className ){
            var $html = api.toEl( node ).addClass( className );

            items[ className ].html = $html[ 0 ].outerHTML;
            items[ className ].selected = node.values.classes.includes( className )
          })
        }
      }
    }
  }
}

module.exports = style
