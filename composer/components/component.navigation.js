const utils = require( '../../src/utils/utils' )

module.exports = function( $, templates, persistence, options ){
  return {
    name: 'Navigation',
    icon: 'sitemap',
    values: {},
    render: function( components, node, $el, callback ){
      var $container = $el.is( '[data-container]' ) ? $el : $el.find( '[data-container]' ).first();

      persistence.get( 'page', function( err, pages ){
        if( err ) throw err

        var page = pages.find( p => p.id === options.page )

        var links = pages.filter( p => p.isTop && !p.excludeFromNavigation )
          .map( p => {
            if( page ){
              p.isCurrent = p.id === page.id || page.path.slice( 1 ).includes( p.id )
            }

            return p
          })
          .sort( utils.sortBy( p => new Date( p.created ) ) )
          .sort( utils.sortBy( p => p.order || 0 ) )

        var navigation = {
          links: links
        };

        var $navigation = templates[ 'navigation-links' ]( navigation );

        $container.html( $navigation );

        if( callback ) callback( $el )
      });
    },
    modules: {
      style: {}
    }
  }
}
