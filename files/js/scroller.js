(function(){
  'use strict';
  
  var scroller = window.scroller = {
    $el: $( 'html, body' ),
    $container: $( window ),
    setDelta: setDelta
  };
  
  var delta = 0;
  
  function setDelta( e ){
    var h = scroller.$container.height();
    //offset event position so that above vertical centre is negative, below is positive (eg scroll up/down)
    var y = e.clientY - h / 2;
    
    delta = 0;
    //only set delta is the event is triggered at the top or bottom of the screen (should be container not viewport?)
    if( e.clientY <= 88 || e.clientY >= h - 88 ){
      delta = y * 0.01;
    }
  }
  
  function scroll(){
    if( delta !== 0 ) {
      scroller.$el.scrollTop( function( i, v ){
        return v + delta;
      });
    }
    
    requestAnimationFrame( scroll );
  }   
  
  scroll();
})();