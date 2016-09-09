module.exports = {
  save: function( obj, callback ){
    $.post( '/cms/store/save/', { obj: JSON.stringify( obj ) }, function( data ){
      callback( null, data );
    });
  },
  load: function( id, callback ){
    $.getJSON( '/cms/store/load/' + id, function( data ){
      callback( null, data );
    });
  },
  get: function( type, callback ){
    $.getJSON( '/cms/store/get/' + type, function( data ){
      callback( null, data );
    });
  }
};