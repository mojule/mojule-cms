module.exports = function( $, templates, persistence ){
  return {
    name: 'Email Input',
    icon: 'envelope-o',
    values: {
      html: 'Email',
      required: true,
      default: ''
    },
    modules: {
      text: {}
    },
    editor: {
      tab: 'edit',
      groups: {
        "formEmail": {
          title: 'Input Settings',
          type: 'input',
          template: 'toolbar-switch',          
          items: {
            required: {
              _id: 'required',
              title: 'Field Required',
              checked: true
            }
          },
          change: function( item, node, value, callback, $el ){            
            if( item.key === 'required' ){
              node.values.required = value;
              callback( node );
            }
          },
          init: function( node, items ){
            items.required.checked = node.values.required;
          }
        }
      }
    }
  };
};  