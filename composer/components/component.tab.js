module.exports = function( $, templates, persistence ){
  var newTitle = 'New Tab';

  return {
    name: 'Tab',
    icon: 'folder-o',
    accepts: '*',
    parents: [ 'tabs' ],
    selectParent: true,
    values: {      
      title: newTitle,
      preventMove: true,
      active: true
    },
    isVertical: false,
    headerText: function( node ){
      return 'Tab (' + node.values.title + ')';
    }
  };
};  