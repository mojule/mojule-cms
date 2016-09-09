module.exports = function( $, templates, persistence ){
  return {
    name: 'Grid',
    icon: 'th',
    accepts: '*',
    values: {
      large: {
        width: 3
      },
      medium: {
        width: 2
      },
      small: {
        width: 1
      }
    },
    wrap: 'gridBlock',
    isNonEmptyDropzone: true,
    editor: {
      tab: 'edit',
      groups: {
        "grid": {
          title: 'Grid Settings',
          type: 'input',
          template: 'toolbar-number',
          items: {
            large: {
              key: 'large',
              id: 'large',
              title: 'Large Per Row',
              min: 1,
              max: 12
            },
            medium: {
              key: 'medium',
              id: 'small',
              title: 'Medium Per Row',
              min: 1,
              max: 12
            },
            small: {
              key: 'small',
              id: 'small',
              title: 'Small Per Row',
              min: 1,
              max: 12
            }
          },
          change: function( item, node, value, callback, $el ){
            node.values[ item.key ].width = value * 1
            callback( node )
          },
          init: function( node, items ){
            [ 'small', 'medium', 'large' ].forEach( key => {
              items[ key ].value = node.values[ key ].width;
            })
          }
        }
      }
    }
  }
}
