function pad( val ){
  var str = val + ''
  
  return str.length === 1 ? '0' + str : str
}

$( function(){
  var $sharePrice = $( '.user-share-price' )
  var $updated = $( '.user-share-price-updated' )
  
  if( $sharePrice.length > 0 ){    
    $.getJSON( '/cms/plugins/sharePrice', function( values ){
      var updated = new Date( values.lastChecked )
      
      var date = [ 
        updated.getFullYear(), 
        pad( updated.getMonth() + 1 ), 
        pad( updated.getDate() ) 
      ].join( '-' )
      
      var time = [ 
        pad( updated.getHours() ), 
        pad( updated.getMinutes() ) 
      ].join( ':' )
      
      $sharePrice.text( '$' + values.price )
      $updated.html( '<em>Updated ' + date + ' ' + time + '</em>' )
    })
  }
})