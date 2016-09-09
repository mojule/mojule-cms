module.exports = function( $, templates, persistence ){
  var boxTypes = {
    div: 'Box',
    header: 'Header Box',
    footer: 'Footer Box',
    main: 'Main Box'
  };

  function createEditorAction( boxType ){
    return {
      title: boxTypes[ boxType ],
      html: '<i class="fa fa-2x fa-square-o"></i>'
    };
  }

  var box = {
    name: 'Box',
    icon: 'square-o',
    accepts: '*',
    values: {
      boxType: 'div'
    },
    editor: {
      tab: 'edit',
      groups: {
        "box-type": {
          title: 'Box Type',
          type: 'select-single',
          template: 'toolbar-preview',
          items: {},
          click: function( item, node, callback ){
            node.values.boxType = item.key;
            callback( node );
          },
          init: function( node, items ){
            var boxType = node.values.boxType || 'div';
            Object.keys( items ).forEach( key => {
              const item = items[ key ]
              item.selected = key === boxType
            })
          }
        },
        "constrained": {
          title: 'Box Width',
          type: 'input',
          template: 'toolbar-switch',
          items: {
            constrain: {
              _id: 'constrain-width',
              title: 'Constrain Width',
              checked: false
            }
          },
          change: function( item, node, value, callback, $el ){
            if( item.key === 'constrain' ){
              if( !Array.isArray( node.values.classes )){
                node.values.classes = []
              }

              node.values.classes = node.values.classes.filter( c => c !== 'row' )

              if( value ){
                node.values.classes.push( 'row' )
              }

              callback( node );
            }
          },
          init: function( node, items ){
            items.constrain.checked = Array.isArray( node.values.classes ) && node.values.classes.includes( 'row' )
          }
        }
      }
    },
    headerText: function( node ){
      return node.values.boxType ? boxTypes[ node.values.boxType ] : 'Box'
    },
    modules: {
      style: {},
      saveTemplate: {},
      link: {}
    }
  };

  Object.keys( boxTypes ).forEach( function( boxType ){
    box.editor.groups[ 'box-type' ].items[ boxType ] = createEditorAction( boxType );
  });

  return box;
};