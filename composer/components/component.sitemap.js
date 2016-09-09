module.exports = function( $, templates, persistence, options ){
  return {
    name: 'Sitemap',
    icon: 'sitemap',
    values: {},
    render: function( components, node, $el, callback ){
      const $container = $el.is( '[data-container]' ) ? $el : $el.find( '[data-container]' ).first()

      if( options.sitemapData ){
        const $navigation = templates[ 'sitemap-node' ]( options.sitemapData )

        $container.html( $navigation )
      } else {
        $container.html( '<em>Sitemap</em>' )
      }

      if( callback ) callback( $el )
    },
    modules: {
      style: {}
    }
  }
}
