module.exports = function( $, templates, persistence ){
  return {
    name: 'Dropdown Input',
    icon: 'toggle-down',
    values: {
      html: 'Options',
      required: true,
      items: []
    },
    modules: {
      text: {},
      list: {}
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