module.exports = function( $, templates, persistence ){
  var tagsApi = require( '../../src/tags' )()

  return {
    id: 'link-dialog',
    title: 'Link',
    template: 'link-dialog',
    type: 'ok-cancel',
    values: {
      url: ''
    },
    init: function( $dialog, values ){
      $dialog.find( '[name="url"]' ).val( values.url );
      $dialog.find( '#pages' ).html( 'Loading...' );
      $dialog.find( '#files' ).html( 'Loading...' );

      persistence.get( 'page', function( err, pages ){
        if( err ) throw err

        pages.forEach( function( page ){
          page.data = Array.isArray( page.data ) ? page.data : []

          page.data.push({
            key: 'url',
            value: page.id
          })

          page.icon = 'globe'

          delete page.url
        })

        var $pages = templates[ 'filter-icon-library' ]({
          library: {
            items: pages
          },
          tags: tagsApi.viewModels( pages )
        })

        $pages.append( '<script src="/js/filter-tags.js"></script>' )

        var $li = $pages.find( 'li' )

        $dialog.find( '#pages' ).html( $pages )

        $pages.on( 'click', 'li', function(){
          $li.removeClass( 'selected' )
          $( this ).addClass( 'selected' )
        })

        $li.first().addClass( 'selected' )

        $li.each( function(){
          if( $( this ).attr( 'data-url' ) === values.url ){
            $( this ).click()
          }
        })
      })

      persistence.get( 'file', function( err, files ){
        if( err ) throw err

        files.forEach( function( file ){
          var urlData = {
            key: 'url',
            value: file.id
          }

          if( Array.isArray( file.data ) ){
            file.data.push( urlData )
          } else {
            file.data = [ urlData ];
          }

          delete file.url;
        });

        var tags = tagsApi.viewModels( files )

        var $files = templates[ 'filter-icon-library' ]({
          library: {
            items: files
          },
          tags: tags
        });

        var $li = $files.find( 'li[data-url]' );

        $files.append( '<script src="/js/filter-tags.js"></script>' )

        $dialog.find( '#files' ).html( $files );

        $files.on( 'click', 'li[data-url]', function(){
          $li.removeClass( 'selected' );
          $( this ).addClass( 'selected' );
        });

        $li.first().addClass( 'selected' );

        $li.each( function(){
          if( $( this ).attr( 'data-url' ) === values.url ){
            $( this ).click();
          }
        });


      });
    },
    getData: function( $dialog ){
      var tab = $dialog.find( '#pages' ).is( '.active' ) ? 'pages' : $dialog.find( '#files' ).is( '.active' ) ? 'files' : 'url';

      if( tab === 'pages' ){
        return {
          url: $( '#pages .selected' ).attr( 'data-url' )
        }
      }

      if( tab === 'files' ){
        return {
          url: $( '#files li[data-url].selected' ).attr( 'data-url' )
        }
      }

      return {
        url: $dialog.find( '[name="url"]' ).val()
      }
    }
  };
};