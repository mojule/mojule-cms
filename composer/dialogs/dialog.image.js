module.exports = function( $, templates, persistence ){
  return {
    id: 'image-dialog',
    title: 'Image',
    template: 'image-dialog',
    type: 'ok-cancel',
    values: {
      src: ''
    },
    init: function( $dialog, values ){
      $dialog.find( '[name="src"]' ).val( values.src );
      $dialog.find( '#library' ).html( 'Loading...' );

      persistence.get( 'image', function( err, images ){
        if( err ) throw err

        var tags = []

        images.forEach( function( image ){
          if( Array.isArray( image.tags )){
            image.tags.forEach( function( tag ){
              if( tags.indexOf( tag ) === -1 && tag !== '' ){
                tags.push( tag )
              }
            })
          }

          if( image.width === image.height ){
            image.ratio = 'square';
            return;
          }

          if( image.width > image.height ){
            image.ratio = 'landscape';
            return;
          }

          image.ratio = 'portrait';
        });

        tags.concat( 'All' )

        var tagItems = tags.sort().map( function( tag ){
          return {
            value: tag,
            selected: tag === 'All'
          }
        })

        var $images = templates[ 'filter-icon-library' ]({
          library: {
            items: images
          },
          tags: tagItems
        });

        $images.append( '<script src="/js/filter-tags.js"></script>' )

        var $li = $images.find( 'li[data-src]' );

        $dialog.find( '#library' ).html( $images );

        $images.on( 'click', 'li[data-src]', function(){
          $li.removeClass( 'selected' );
          $( this ).addClass( 'selected' );
        });

        $li.first().addClass( 'selected' );

        $li.each( function(){
          if( $( this ).attr( 'data-src' ) === values.src ){
            $( this ).click();
          }
        });
      });
    },
    getData: function( $dialog ){
      var tab = $dialog.find( '#library' ).is( '.active' ) ? 'library' : 'url';

      if( tab === 'url' ){
        return {
          src: $dialog.find( '[name="src"]' ).val()
        }
      }

      return {
        src: $( '#library li[data-src].selected' ).attr( 'data-src' )
      }
    }
  };
};