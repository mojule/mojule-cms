module.exports = function( $, templates, persistence ){
  function updateRow( rowNode ){
    rowNode.children.forEach( function( columnNode ){
      columnNode.values.isEnd = columnNode === rowNode.children[ rowNode.children.length - 1 ]
    })
  }

  return {
    name: 'Columns',
    icon: 'columns',
    accepts: '*',
    wrap: 'column',
    onChanged: function( root, node ){
      updateRow( rowNode );
    },
    isNonEmptyDropzone: true,
    values: {
      collapsed: false
    },
    editor: {
      tab: 'edit',
      groups: {
        "columns": {
          title: 'Column Settings',
          type: 'input',
          template: 'toolbar-switch',
          items: {
            collapse: {
              _id: 'collapse-columns',
              title: 'Collapse Columns',
              checked: false
            }
          },
          change: function( item, node, value, callback, $el ){
            if( item.key === 'collapse' ){
              node.values.collapsed = value;
              callback( node );
            }
          },
          init: function( node, items ){
            items.collapse.checked = node.values.collapsed;
          }
        },
        "fullwidth": {
          title: 'Column Set Width',
          type: 'input',
          template: 'toolbar-switch',
          items: {
            fullwidth: {
              _id: 'fullwidth',
              title: 'Full Width',
              checked: false
            }
          },
          change: function( item, node, value, callback, $el ){
            if( item.key === 'fullwidth' ){
              if( !Array.isArray( node.values.classes )){
                node.values.classes = []
              }

              node.values.classes = node.values.classes.filter( c => c !== 'fullWidth' )

              if( value ){
                node.values.classes.push( 'fullWidth' )
              }

              callback( node );
            }
          },
          init: function( node, items ){
            items.constrain.checked = Array.isArray( node.values.classes ) && node.values.classes.includes( 'fullWidth' )
          }
        }
      }
    }
  };
};