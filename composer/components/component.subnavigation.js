const utils = require( '../../src/utils/utils' )

module.exports = function( $, templates, persistence, options ){
  return {
    name: 'Subnavigation',
    icon: 'sitemap',
    values: {},
    render: function( components, node, $el, callback ){
      var $container = $el.is( '[data-container]' ) ? $el : $el.find( '[data-container]' ).first()

      if( !options.page ){
        if( options.isRenderMode ){
          $container.html( '' )
        } else {
          $container.html( '<em>Subnavigation</em>' )
        }

        if( callback ) callback( $el )

        return
      }

      $container.html( '' )

      persistence.get( 'page', function( err, pages ){
        if( err ) throw err

        const page = pages.find( p => p.id === options.page )

        if( !page.isHome ){
          var links = pages.filter( p => p.isTop && !p.excludeFromNavigation )
            .map( p => {
              if( page ){
                p.isCurrent = p.id === page.id || page.path.slice( 1 ).includes( p.id )
              }

              return p
            })
            .sort( utils.sortBy( p => new Date( p.created ) ) )
            .sort( utils.sortBy( p => p.order || 0 ) )

          if( links.length > 0 ){
            var navigation = {
              links: links
            }

            var $navigation = templates[ 'navigation-links' ]( navigation )

            $container.append( $navigation )
          }
        }

        const breadCrumbLinks = page.path.map( id => {
          var current = pages.find( p => p.id === id )

          current.isCurrent = current.id === page.id

          return current
        })

        var $breadcrumbs = templates[ 'breadcrumbs' ]( { links: breadCrumbLinks } )

        $container.append( $breadcrumbs )

        if( callback ) callback( $el )
      })
    },
    modules: {
      style: {}
    }
  }
}
