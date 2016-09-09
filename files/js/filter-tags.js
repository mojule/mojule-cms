$( function(){
  var $filterTagActions = $( 'li[data-tag]' );
  var $filterable = $( 'li[data-tags]' );
  
  $filterable.css({ clear: 'none' });
  
  function show( tag ){
    $filterable.hide();

    var $withTag
    
    if( tag === 'Trash' ){
      $withTag = $filterable.filter( '[data-tags~="' + tag + '"]' )
    } else if( tag === 'All' ){      
      $withTag = $filterable.not( '[data-tags~="Trash"]' )
    } else {
      $withTag = $filterable.filter( '[data-tags~="' + tag + '"]' ).not( '[data-tags~="Trash"]' )
    }
    
    $withTag.show();
    
    $( document ).foundation();    
  }
  
  $filterTagActions.click( function(){
    var $current = $( this );
    
    $filterTagActions.removeClass( 'selected' );
    $current.addClass( 'selected' );
    
    var tag = $current.attr( 'data-tag' );
    
    show( tag )
  });
  
  show( 'All' )
});