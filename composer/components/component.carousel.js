module.exports = function( $, templates, persistence ){
  return {
    name: 'Carousel',
    icon: 'exchange',
    accepts: '*',
    wrap: 'slide',
    values: {
      currentSlide: 0,
      mode: 'carousel'
    },
    editor: {
      tab: 'edit',
      groups: {
        "carousel-edit-mode": {
          title: 'Editing Mode',
          type: 'select-single',
          template: 'toolbar-icon',
          items: {
            carousel: {
              title: 'Carousel View',
              icon: 'exchange',
              selected: true
            },
            list: {
              title: 'List View',
              icon: 'reorder'
            }
          },
          click: function( item, node, callback ){
            if( node ){
              node.values.mode = item.key;

              if( item.key === 'carousel' ) node.values.currentSlide = 0
            }

            if( callback ) callback( node )
          }
        },
        insert: {
          title: 'Slides',
          type: 'button',
          template: 'toolbar-icon',
          items: {
            before: {
              title: 'New Slide',
              icon: 'arrow-circle-left'
            },
            after: {
              title: 'New Slide',
              icon: 'arrow-circle-right'
            },
            remove: {
              title: 'Delete Current',
              icon: 'trash'
            }
          },
          click: function( item, node, callback, $selected, components ){
            const api = require( '../component-api' )( $, templates, persistence, components )

            console.log( item );

            if( item.key === 'before' ){
              node.children.splice( node.values.currentSlide, 0, api.createNode( 'slide' ) );
            }

            if( item.key === 'after' ){
              node.children.splice( node.values.currentSlide + 1, 0, api.createNode( 'slide' ) );
              node.values.currentSlide++;
            }

            if( item.key === 'remove' ){
              node.children.splice( node.values.currentSlide, 1 );
            }

            callback( node );
          }
        }
      }
    },
    onCreating: function( node, components ){
      const api = require( '../component-api' )( $, templates, persistence, components )

      if( node.children.length === 0 ){
        node.children = [ api.createNode( 'slide' ) ];
      }

      if( node.values.mode === 'list' ){
        node.children.forEach( slide => {
          slide.values.preventMove = false;
          slide.values.preventDelete = false;
        });

        return;
      }

      if( node.values.currentSlide >= node.children.length ) node.values.currentSlide = node.children.length - 1;

      if( node.values.currentSlide < 0 ){
        node.values.currentSlide = 0;
      }
    },
    onCreated: function( node, $el, selectById ){
      var $sliderContainer = $el.find( '[data-container]' ).first();

      if( $sliderContainer.is( '.slick-initialized' ) ){
        $sliderContainer.slick( 'unslick' );
      }

      if( node.values.mode === 'carousel' ){
        $sliderContainer.slick({
          dots: true,
          adaptiveHeight: true,
          infinite: false,
          initialSlide: node.values.currentSlide
        });

        $sliderContainer.on( 'beforeChange', function(event, slick, currentSlide, nextSlide){
          node.values.currentSlide = nextSlide;
        });
      }
    },
    onBeforeElToNode: function( node, $el ){
      var $sliderContainer = $el.find( '[data-container]' ).first();

      if( $sliderContainer.is( '.slick-initialized' ) ){
        $sliderContainer.slick( 'unslick' );
      }
    }
  };
}
