module.exports = function( $, templates, persistence ){
  return {
    name: 'Checkbox Input',
    icon: 'check-square-o',
    values: {
      html: 'Yes/No',
      required: true,
      default: true
    },
    modules: {
      text: {}
    },
    editor: {
      tab: 'edit',
      groups: {
        "formCheckbox": {
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