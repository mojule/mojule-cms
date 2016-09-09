module.exports = function( $, templates, persistence ){
  function createEditorAction( i ){
    return {
      title: 'Heading ' + i,
      html: '<h' + i + '>AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz</h' + i + '>'
    }
  }

  var heading = {
    name: 'Heading',
    icon: 'header',
    values: {
      level: 1,
      html: 'New Heading'
    },
    editor: {
      tab: 'edit',
      groups: {
        "heading-level": {
          title: 'Heading Level',
          type: 'select-single',
          template: 'toolbar-preview',
          items: {},
          click: function( item, node, callback ){
            var level = item.key.substr( 1 ) * 1
            node.values.level = level
            callback( node )
          },
          init: function( node, items ){
            var level = node.values.level

            Object.keys( items ).forEach( key => {
              items[ key ].selected = key === 'h' + level
            })
          }
        }
      }
    },
    modules: {
      text: {},
      image: {},
      style: {}
    }
  }

  for( var i = 1; i <= 6; i++ ){
    heading.editor.groups[ "heading-level" ].items[ "h" + i ] = createEditorAction( i )
  }

  return heading
}
