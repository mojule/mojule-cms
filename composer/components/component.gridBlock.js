module.exports = function( $, templates, persistence ){
  return {
    name: 'Grid Block',
    icon: 'th',
    accepts: '*',
    parents: [ 'grid' ],
    isVertical: true
  };
};