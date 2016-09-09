module.exports = function( $, templates, persistence ){


  return {
    id: 'preview',
    title: 'Page Preview',
    template: 'preview-dialog',
    type: 'full',
    init: function( $dialog, values ){
      const api = require( '../component-api' )( $, templates, persistence, values.components )

      var $content = $dialog.find( '[data-content]' )

      var $columns = $content.find( '.columns' )

      $columns.html( api.toEl( values.root ) )

      $( document ).foundation()

      $content.find( '.carousel' ).slick({
        dots: true,
        adaptiveHeight: true,
        infinite: true
      })
    }
  }
}
