var $ = require( './$' );
var templates = require( './templates' );

var styles = {
  getSelectors: function( document ){
    var selectors = [];
    for( var i = 0; i < document.styleSheets.length; i++ ){
      var sheet = document.styleSheets[ i ];
      var $owner = $( sheet.ownerNode );

      if( $owner.is( '[data-style]' ) ){
        for( var j = 0; j < sheet.cssRules.length; j++ ){
          var rule = sheet.cssRules[ j ];
          if( rule.selectorText ){
            selectors.push( rule.selectorText );
          }
        }
      }
    }
    return selectors;
  },
  getClasses: function( document ){
    var selectors = styles.getSelectors( document );

    var classes = [];
    selectors.forEach( function( selector ){
      var split = selector.trim().replace( /\,/g, ' ' ).split( /\s+/g )
      split.forEach( function( selector ){
        var current = selector.trim();
        if( current.length > 0 && current.indexOf( '.user-' ) === 0 ){
          classes.push( current.substr( 1 ) );
        }
      });
    });

    return Array.from( new Set( classes ) )
  }
};

module.exports = styles;