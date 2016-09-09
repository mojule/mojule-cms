module.exports = function( $, templates, persistence ){
  return {
    name: 'Image',
    icon: 'picture-o',
    values: {
      src: '/img/placeholder.svg'
    },
    onCreate: function( node, $el, selectById ){
      var $img = $el.is( 'img' ) ? $el : $el.find( 'img' ).first();

      $img.on( 'click', function(){
        selectById( node._id );
      });
    },
    editor: {
      tab: 'edit',
      groups: {
        "image-src": {
          title: 'Image Settings',
          type: 'button',
          template: 'toolbar-icon',
          items: {
            src: {
              title: 'Select',
              icon: 'folder-open-o'
            }
          },
          click: function( item, node, callback, $el ){
            var dialogs = require( '../dialogs' )( $, templates, persistence )

            if( item.key === 'src' ){
              dialogs.getValue( 'image', node.values, function( values ){
                if( values && values.src && values.src !== '' ){
                  $el.attr( 'href', values.src );
                  node.values.src = values.src;
                  callback( node );
                }
              });
              return;
            }

            callback( node );
          }
        }
      }
    },
    modules: {
      style: {},
      link: {}
    }
  };
};