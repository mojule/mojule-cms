function isWindow( el ){
  return el === window
}

function extend(a, b) {
	for (var k in b) a[k] = b[k];
	return a;
}

function position(element, relativeTo) {
	var isWin = isWindow(element);
	var doc = isWin ? element.document : element.ownerDocument || element;
	var docEl = doc.documentElement;
	var win = isWindow(relativeTo) ? relativeTo : doc.defaultView || window;

	// normalize arguments
	if (element === doc) element = docEl;
	relativeTo = !relativeTo || relativeTo === doc ? docEl : relativeTo;

	var winTop = (win.pageYOffset || docEl.scrollTop) - docEl.clientTop;
	var winLeft = (win.pageXOffset || docEl.scrollLeft) - docEl.clientLeft;
	var box = { top: 0, left: 0 };

	if (isWin) {
		box.width = box.right = win.innerWidth || docEl.clientWidth;
		box.height = box.bottom = win.innerHeight || docEl.clientHeight;
	} else if (element === docEl) {
		box.top = -winTop;
		box.left = -winLeft;
		box.width = Math.max(docEl.clientWidth, docEl.scrollWidth);
		box.height = Math.max(docEl.clientHeight, docEl.scrollHeight);
		box.right = box.width - winLeft;
		box.bottom = box.height - winTop;
	} else if (docEl.contains(element) && element.getBoundingClientRect) {
		// new object needed because DOMRect properties are read-only
		box = extend({}, element.getBoundingClientRect());
		// width & height don't exist in <IE9
		box.width = box.right - box.left;
		box.height = box.bottom - box.top;
	} else {
		return null;
	}

	// current box is already relative to window
	if (relativeTo === win) return box;

	// add window offsets, making the box relative to documentElement
	box.top += winTop;
	box.left += winLeft;
	box.right += winLeft;
	box.bottom += winTop;

	// current box is already relative to documentElement
	if (relativeTo === docEl) return box;

	// subtract position of other element
	var relBox = position(relativeTo);
	box.left -= relBox.left;
	box.right -= relBox.left;
	box.top -= relBox.top;
	box.bottom -= relBox.top;

	return box;
}

function cover( root, container, el ) {
  var c = document.createElement('div')

  container.appendChild(c)

  var place = function() {
    var els = window.getComputedStyle(el)

    c.style.position = els.position=='fixed' ? 'fixed':'absolute'
    c.style.zIndex = parseInt(els.zIndex)+1

    var pos = position( el, container )

    if( pos == null ) return

    c.style.width = el.offsetWidth+'px'
    c.style.height = el.offsetHeight+'px'
    c.style.left = pos.left + 'px'
    c.style.top = pos.top + 'px'

    window.setTimeout( place, 500 )
  };

  place()

  window.addEventListener( 'resize', place )

  return c
}

module.exports = function( $, templates, persistence ){
  const Tree = require( '../../src/tree' )

  return {
    id: 'pageAccess',
    title: 'Page Access',
    template: 'page-access-dialog',
    type: 'app',
    isOkCancel: true,
    values: {
      items: []
    },
    init: function( $dialog, values ){
      const api = require( '../component-api' )( $, templates, persistence, values.components )
      var $content = $dialog.find( '[data-content]' )

      var $title = $content.find( '.page-access header h1' )

      $title.text( values.title )

      var $selection = $content.find( '.page-access .selection' )
      var $container = $content.find( '.page-access .content' )

      var $modal = $container.closest( '.reveal-modal' )

      const modalStyle = window.getComputedStyle( $modal.get( 0 ) )

      $container.css({ position: 'relative' })

      api.toEl( values.root, false, function( $html ){
        $container.html( $html );

        var $overlay = $( '<div data-overlay></div>' )

        $container.append( $overlay )

        $overlay.css({
          opacity: 0.75,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        })

        $( document ).foundation();

        $content.find( '.carousel' ).slick({
          dots: true,
          adaptiveHeight: true,
          infinite: true
        })

        var nodes = {}

        var $selectionTree = $( '<ul class="selection-tree"></ul>' )

        Tree( values.root ).walk( function( node, depth ){
          nodes[ node._id ] = node

          var $el = $container.find( '[data-node="' + node._id + '"]' )

          var rootEl = document.querySelector( 'body' )
          var containerEl = $overlay.get( 0 )
          var el = $el.get( 0 )

          var $cover = $( cover( rootEl, containerEl, el ) )

          $cover.attr( 'data-cover', true )
          $cover.attr( 'data-id', node._id )
          $cover.attr( 'data-key', node.key )
          $cover.attr( 'title', node.key )

          var $li = $( '<li></li>' )
          var $label = $( '<label></label>' )
          var $input = $( '<input type="checkbox" />' )
          var $text = $( '<span></span>' )

          $input.attr( 'value', node._id )

          $label.append( $input )
          $label.append( $text )

          var text = '&nbsp;'
          for( var i = 0; i < depth * 2; i++ ){
            text += '&nbsp;'
          }

          text += node.key

          $text.html( text )

          $li.append( $label )

          if( node.values.isLocked ){
            $cover.addClass( 'locked' )
            $label.addClass( 'locked' )
            $input.attr( 'disabled', 'disabled' )
          } else {
            $el.css({
              outline: '2px groove #39f'
            })

            $cover.addClass( 'unlocked' )
            $label.addClass( 'unlocked' )

            $input.on( 'click', e => {
              e.preventDefault()
            })
            $label.on( 'click', e => {
              e.preventDefault()

              var $cover = $( '[data-cover][data-id="' + node._id + '"]' )
              $cover.trigger( 'click' )
            })
          }

          $overlay.append( $cover )
          $selectionTree.append( $li )
        })

        $selection.append( $selectionTree )

        $overlay.on( 'click', function( e ){
          var $target = $( e.target )

          if( !$target.attr( 'data-cover' ) ) return

          var id = $target.attr( 'data-id' )
          var node = nodes[ id ]

          var isSelected = $target.hasClass( 'selected' )
          var isLocked = $target.hasClass( 'locked' )

          Tree( node ).walk( function( n ){
            var $el = $overlay.find( '[data-id="' + n._id + '"]' )

            var isLocked = $el.hasClass( 'locked' )

            if( !isLocked ) $el.toggleClass( 'selected', !isSelected )

            var $selectionInput = $selection.find( 'input[value="' + n._id + '"]' )

            $selectionInput.prop( 'checked', $el.hasClass( 'selected') )
          })

          var $parentSelectionInput = $selection.find( 'input[value="' + node._id + '"]' )
          var selectionPosition = $parentSelectionInput.offset().top - $selection.offset().top + $selection.scrollTop()

          $selection.scrollTop( selectionPosition )
        })

        $container.on( 'click', function( e ){
          if( e.target.tagName.toLowerCase() === 'a' ){
            e.preventDefault()
          }
        })

        if( Array.isArray( values.selected ) ){
          values.selected.forEach( id => {
            var $cover = $( '[data-cover][data-id="' + id + '"]' )
            $cover.trigger( 'click' )
          })
        }
      })
    },
    getData: function( $dialog ){
      const values = []

      const $selectionContainer = $dialog.find( '.selection' )
      const $selectedItems = $selectionContainer.find( 'input[type="checkbox"]:checked' )

      $selectedItems.each( function(){
        const $item = $( this )

        values.push( $item.attr( 'value' ) )
      })

      return values
    }
  }
}
