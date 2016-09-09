module.exports = function( $, templates, persistence ){
  return {
    name: 'Link Box',
    icon: 'link',
    accepts: '*',
    modules: {
      style: {},
      link: {}
    }    
  };
};