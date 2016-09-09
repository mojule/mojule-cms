module.exports = function( $, templates, persistence ){
  return {
    name: 'Slide',
    icon: 'square-o',
    accepts: '*',
    selectParent: true,
    values: {
      preventMove: true,
      preventDelete: true
    },
    parents: [ 'carousel' ]
  };  
}