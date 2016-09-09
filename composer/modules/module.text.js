var $ = require( '../$' );
var templates = require( '../templates' );
var persistence = require( '../persistence' );
var dialogs = require( '../dialogs' )( $, templates, persistence );

var textFormatting = {
  bold: {
    title: 'Bold',
    icon: 'bold',
    tag: 'strong'
  },
  italic: {
    title: 'Italic',
    icon: 'italic',
    tag: 'em'
  },
  underline: {
    title: 'Underline',
    icon: 'underline',
    tag: 'u'
  },
  strikethrough: {
    title: 'Strikethrough',
    icon: 'strikethrough',
    tag: 's'
  },
  superscript: {
    title: 'Superscript',
    icon: 'superscript',
    tag: 'sup'
  },
  subscript: {
    title: 'Subscript',
    icon: 'subscript',
    tag: 'sub'
  },
  link: {
    title: 'Link',
    icon: 'link',
    tag: 'a',
    attr: {
      href: '',
      'data-new': true
    }
  }
};

function getMedium( $el ){
  var medium = $el.data( 'medium' );

  if( !medium ){
    medium = new IMedium({
      element: $el[ 0 ],
      mode: Medium.richMode,
      placeholder: 'Your Text',
      attributes: null,
      tags: null
    });

    $el.data( 'medium', medium )
  }

  $el.focus()

  return medium
}

function getTextElement( $el ){
  return $el.is( '[data-text]' ) ? $el : $el.find( '[data-text]' ).first();
}

var text = {
  name: 'Text',
  icon: 'pencil-square-o',
  onCreate: function( node, $el, selectById ){
    var $text = getTextElement( $el );
    getMedium( $text );
    var $component = $el.closest( '[data-component]' );
    var $header = $component.find( '> [data-header]' );

    $text.on( 'focus', function(){
      selectById( node._id );
    });
  },
  poll: {
    delay: 500,
    on: function( node, $el ){
      var $text = getTextElement( $el );
      node.values.html = $text.html();
    }
  },
  onDeselect: function( node, $el ){
    var $text = getTextElement( $el );
    node.values.html = $text.html();
    return true;
  },
  editor: {
    tab: 'edit',
    groups: {
      'text-formatting': {
        title: 'Text Formatting',
        type: 'button',
        template: 'toolbar-small',
        items: {},
        click: function( item, node, callback, $el ){
          var $text = getTextElement( $el );

          if( $text.length === 0 ) return;

          var medium = getMedium( $text );

          var textSetting = textFormatting[ item.key ];
          var attr = textSetting.attr || {}

          medium.invokeElement( textSetting.tag, attr );
          node.values.html = $text.html();

          if( item.key === 'link' ){
            var $a = $text.find( '[data-new]' );

            if( $a.length === 0 ) return;

            var values = {
              url: $a.attr( 'href' )
            };

            dialogs.getValue( 'link', values, function( values ){
              if( values && values.url && values.url !== '' ){
                $a.attr( 'href', values.url );
                $a.removeAttr( 'data-new' );
              } else {
                $a.replaceWith( $a.html() );
              }

              node.values.html = $text.html();
            });
          }
        }
      }
    }
  }
};

Object.keys( textFormatting ).forEach( key => {
  const value = textFormatting[ key ]

  value.key = key
  text.editor.groups[ 'text-formatting' ].items[ key ] = value
})

module.exports = text
