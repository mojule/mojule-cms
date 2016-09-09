$( function(){
  var $page = $( '.page' );
  var $sliders = $( '.carousel:not( .user-carousel-autoplay .carousel )' );
  var $autoplaySliders = $( '.user-carousel-autoplay .carousel' );
  var $imgLinks = $( 'img[src^="/files/file-"]' );

  var pageState = {
    pixelRatio: window.devicePixelRatio ? window.devicePixelRatio : 1,
    width: $page.width(),
    height: $page.height()
  };

  $sliders.slick({
    dots: true,
    adaptiveHeight: true,
    infinite: false
  });

  $autoplaySliders.slick({
    dots: true,
    adaptiveHeight: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000
  });

  $imgLinks.each( function( i, el ){
    var srcTemplate = $( el ).attr( 'src' ).replace( /\/64\//g, '/width/' );
    $( el ).data( 'srcTemplate', srcTemplate );
  });

  respond();

  function respond(){
    $imgLinks.each( function( i, el ){
      var srcTemplate = $( el ).data( 'srcTemplate' );
      var width = $( el ).width() * pageState.pixelRatio;

      $( el ).attr( 'src', srcTemplate.replace( /\/width\//g, '/' + width + '/' ) );
    });
  }
});