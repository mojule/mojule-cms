(function( $ ){
  'use strict';
  
  $.fn.insertAt = function( elements, index ){
    var children = this.children();
    if( index >= children.size() ){
      this.append( elements );
      return this;
    }
    var before = children.eq( index );
    $( elements ).insertBefore( before );
    return this;
  };  
})( jQuery );