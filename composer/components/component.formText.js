module.exports = function( $, templates, persistence ){
  return {
    name: 'Text Input',
    icon: 'edit',
    values: {
      html: 'Field Name',
      required: true,
      default: ''
    },
    modules: {
      text: {}
    },
    editor: {
      tab: 'edit',
      groups: {
        "formText": {
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