module.exports = function( $, templates, persistence, formViewModels ){
  var dialogs = {
    modals: {},
    getValue: function( key, values, callback ){
      var modal = dialogs.modals[ key ];

      modal.values = values;

      var $dialog = $( '#dialog-modal' );

      $dialog.removeClass( 'full' );
      $dialog.removeClass( 'app-modal' );

      if( modal.type === 'full' ){
        $dialog.addClass( 'full' );
      } else if ( modal.type === 'app' ){
        $dialog.addClass( 'full' );
        $dialog.addClass( 'app-modal' )
      }

      var $content = $dialog.find( '[data-content]' );

      $content.html( templates[ modal.template ]( modal.values ) );

      $( document ).off( 'close.fndtn.reveal', '#dialog-modal' );

      $( document ).on('close.fndtn.reveal', '#dialog-modal', function () {
        callback( false );
      });

      if( modal.type === 'ok-cancel' || modal.isOkCancel ){
        var $ok = $dialog.find( '[data-confirm]' );
        var $cancel = $dialog.find( '[data-cancel]' );

        $ok.off( 'click' );
        $cancel.off( 'click' );

        $ok.on( 'click', function(){
          $( document ).off( 'close.fndtn.reveal', '#dialog-modal' );
          $( 'html, body' ).removeClass( 'no-overflow' )

          $dialog.foundation( 'reveal', 'close' );

          callback( modal.getData( $dialog ) );

          return false;
        });

        $cancel.on( 'click', function(){
          $( document ).off( 'close.fndtn.reveal', '#dialog-modal' );
          $( 'html, body' ).removeClass( 'no-overflow' )

          $dialog.foundation( 'reveal', 'close' );

          callback( false );

          return false;
        });
      }

      if( modal.type === 'app' ){
        $( document ).on( 'open.fndtn.reveal', '#dialog-modal', function (){
          $( 'html, body' ).addClass( 'no-overflow' )
        })

        $( document ).on('close.fndtn.reveal', '#dialog-modal', function (){
          $( 'html, body' ).removeClass( 'no-overflow' )
        })
      }

      $dialog.foundation( 'reveal', 'open' );

      $dialog.off( 'opened.fndtn.reveal' );

      $dialog.on( 'opened.fndtn.reveal', function () {
        modal.init( $dialog, values );
        $dialog.foundation( 'tab', 'reflow' );
      });
    }
  };

  dialogs.modals[ 'image' ] = require( './dialogs/dialog.image' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'link' ] = require( './dialogs/dialog.link' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'preview' ] = require( './dialogs/dialog.preview' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'template' ] = require( './dialogs/dialog.template' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'form' ] = require( './dialogs/dialog.form' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'list' ] = require( './dialogs/dialog.list' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'listBuilder' ] = require( './dialogs/dialog.listBuilder' )( $, templates, persistence, formViewModels );
  dialogs.modals[ 'pageAccess' ] = require( './dialogs/dialog.pageAccess' )( $, templates, persistence, formViewModels );

  return dialogs;
};