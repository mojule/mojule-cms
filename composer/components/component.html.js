module.exports = function( $, templates, persistence ){
  function getCodeElement( $el ){
    return $el.is( '[data-code]' ) ? $el : $el.find( '[data-code]' ).first();
  }  

  return {
    name: 'HTML',
    icon: 'code',
    values: {
      code: '<p>New Code Snippet</p>'
    },
    onCreate: function( node, $el, selectById ){
      var $code = getCodeElement( $el );      
      $code.on( 'click', function(){
        if( !$code.is( '[contenteditable="true"]' ) ){
          selectById( node._id );
          return false;
        }
      });
    },    
    onSelect: function( node, $el ){
      var $code = getCodeElement( $el );
      $code.attr( 'contenteditable', true );
      $code.text( node.values.code );
    },
    onDeselect: function( node, $el ){
      var $code = getCodeElement( $el );
      var code = $code.text();
      
      node.values.code = code;
      
      $code.attr( 'contenteditable', false );
      
      $code.html( node.values.code );      
    }    
  };  
};