module.exports = function( $, templates, persistence ){
  var newTitle = 'New Tab'

  return {
    name: 'Tabs',
    icon: 'folder-o',
    accepts: '*',
    wrap: 'tab',
    values: {
      selectedTab: 0
    },
    onCreating: function( node, components ){
      const api = require( '../component-api' )( $, templates, persistence, components )

      if( node.children.length === 0 ){
        node.children.push( api.createNode( 'tab' ) )
      }

      if( node.values.selectedTab >= node.children.length ){
        node.values.selectedTab = node.children.length - 1;
      }

      if( node.values.selectedTab < 0 ){
        node.values.selectedTab = 0;
      }

      node.children.forEach( function( tab, i ){
        if( tab.values.title.indexOf( newTitle ) === 0 ){
          tab.values.title = newTitle + ' ' + ( i + 1 );
        }
        tab.values.active = i === node.values.selectedTab;
      });
    },
    onCreated: function( node, $el, selectById ){
      var $tabs = $el.find( '> .tabs' );

      $tabs.on( 'click', 'a', function() {
        var $a = $( this );
        var id = $a.attr( 'href' ).replace( /\#/g, '' );

        node.values.selectedTab = node.children.indexOf(
          node.children.find( c => c._id === id )
        )

        selectById( id )
      });
    },
    editor: {
      tab: 'edit',
      groups: {
        "tab-settings": {
          title: 'Tabs',
          type: 'button',
          template: 'toolbar-icon',
          items: {
            title: {
              title: 'Tab Title',
              icon: 'font'
            },
            before: {
              title: 'New Tab',
              icon: 'arrow-circle-left'
            },
            after: {
              title: 'New Tab',
              icon: 'arrow-circle-right'
            }
          },
          click: function( item, node, callback, $selected, components ){
            const api = require( '../component-api' )( $, templates, persistence, components )

            if( item.key === 'before' ){
              node.children.splice( node.values.selectedTab, 0, api.createNode( 'tab' ) );
            }

            if( item.key === 'after' ){
              node.children.splice( node.values.selectedTab + 1, 0, api.createNode( 'tab' ) );
              node.values.selectedTab++;
            }

            if( item.key === 'title' ){
              var newTitle = window.prompt( 'New title?', node.children[ node.values.selectedTab ].values.title );
              if( newTitle ){
                node.children[ node.values.selectedTab ].values.title = newTitle;
              }
            }

            callback( node );
          }
        }
      }
    }
  };
}