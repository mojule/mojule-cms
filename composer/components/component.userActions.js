module.exports = function( $, templates, persistence, options ){
  return {
    name: 'User Actions',
    icon: 'user',
    values: {},
    render: function( components, node, $el, callback ){
      //render from options
      if( options && options.user ){
        $el.html( templates[ 'siteUserActions' ]( options.user ) )
      } else if( options && options.isRenderMode ) {
        $el.html( '' )
      } else {
        $el.html( '<em>Site User Actions</em>' )
      }

      if( callback ) callback( $el )
    },
    modules: {
      style: {}
    }
  };
};