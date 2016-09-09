module.exports = function( $, templates ){
  var tagsApi = require( '../../src/tags' )()

  return {
    id: 'template-dialog',
    title: 'Blocks',
    template: 'template-dialog',
    type: 'ok-cancel',
    values: {
    },
    init: function( $dialog, templateComponents ){
      $dialog.find( '#templates' ).html( 'Loading...' );

      templateComponents.forEach( function( template ){
        template.data = Array.isArray( template.data ) ? template.data : []
        template.data.push({
          key: 'id',
          value: template._id
        });
        template.icon = 'puzzle-piece';
        template.title = template.values.name;
      });

      var tags = tagsApi.viewModels( templateComponents )

      var $templates = templates[ 'filter-icon-library' ]({
        library: {
          items: templateComponents
        },
        tags: tags
      });

      $templates.append( '<script src="/js/filter-tags.js"></script>' )

      var $li = $templates.find( 'li' );

      $dialog.find( '#templates' ).html( $templates );

      $templates.on( 'click', 'li', function(){
        $li.removeClass( 'selected' );
        $( this ).addClass( 'selected' );
      });

      $li.first().addClass( 'selected' );
    },
    getData: function( $dialog ){
      return $( '#templates .selected' ).attr( 'data-id' );
    }
  };
};