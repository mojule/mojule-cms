module.exports = function( $, templates, persistence ){
  return {
    name: 'Numbered List',
    icon: 'list-ol',
    values: {
      html: '<li>New List Item</li>'
    },
    modules: {
      text: {},
      style: {}
    }
  };
};  