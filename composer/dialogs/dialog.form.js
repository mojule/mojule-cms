module.exports = function( $, templates, persistence ){
  var tagsApi = require( '../../src/tags' )()

  return {
    id: 'form-dialog',
    title: 'Forms',
    template: 'form-dialog',
    type: 'ok-cancel',
    values: {
      id: ''
    },
    init: function( $dialog, forms ){
      $dialog.find( '#forms' ).html( 'Loading...' );

      forms.forEach( function( form ){
        form.icon = 'edit';
        form.title = form.name;
      });

      var tags = tagsApi.viewModels( forms )

      var $forms = templates[ 'filter-icon-library' ]({
        library: {
          items: forms
        },
        tags: tags
      });

      $forms.append( '<script src="/js/filter-tags.js"></script>' )

      $dialog.find( '#forms' ).html( $forms );

      var $li = $forms.find( 'li' );

      $forms.on( 'click', 'li', function(){
        $li.removeClass( 'selected' );
        $( this ).addClass( 'selected' );
      });

      $li.first().addClass( 'selected' );
    },
    getData: function( $dialog ){
      return $( '#forms li.selected' ).attr( 'data-id' )
    }
  };
};