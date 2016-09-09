module.exports = function( $, templates, persistence ){
  return {
    name: 'Column',
    icon: 'columns',
    accepts: '*',
    parents: [ 'columns' ],
    isVertical: true,
    values: {
      large: {
        width: 4
      },
      medium: {
        width: 12
      },
      small: {
        width: 12
      },
      isEnd: true
    },
    editor: {
      tab: 'edit',
      groups: {
        "column": {
          title: 'Column Settings',
          type: 'input',
          template: 'toolbar-number',
          items: {
            large: {
              key: 'large',
              id: 'large',
              title: 'Large Width',
              min: 1,
              max: 12
            },
            medium: {
              key: 'medium',
              id: 'small',
              title: 'Medium Width',
              min: 1,
              max: 12
            },
            small: {
              key: 'small',
              id: 'small',
              title: 'Small Width',
              min: 1,
              max: 12
            }
          },
          change: function( item, node, value, callback, $el ){
            console.log( 'change width', node._id, value * 1 )
            node.values[ item.key ].width = value * 1
            callback( node )
          },
          init: function( node, items ){
            [ 'small', 'medium', 'large' ].forEach( key => {
              items[ key ].value = node.values[ key ].width
            });
          }
        }
      }
    }
  };
};