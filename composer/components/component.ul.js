module.exports = function( $, templates, persistence ){
  return {
    name: 'Bullet List',
    icon: 'list-ul',
    values: {
      html: '<li>New List Item</li>'
    },
    modules: {
      text: {},
      style: {}
    }
  };
};  