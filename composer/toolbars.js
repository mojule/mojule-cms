var $ = require( './$' );
var templates = require( './templates' );
var toolbarTabs = require( './toolbarTabs' );
var persistence = require( './persistence' );
const utils = require( '../src/utils/utils' )

var components = require( './components' )( $, templates, persistence );

var toolbarHandlers = {
  edit: {}
};

var toolbars = {
  tabs: toolbarTabs,
  selectedTab: 'create',
  lastSelectedTab: 'create',
  update: updateTabs,
  click: toolbarClick,
  clickHandlers: toolbarHandlers
};

function updateTabs( $container ){
  function initTab( key, $tab ){
    var tab = toolbars.tabs[ key ]
    Object.keys( tab.groups ).forEach( groupKey => {
      const group = tab.groups[ groupKey ]
      if( group.init ){
        var $group = $tab.find( '> [data-toolbar-group][data-key="' + groupKey + '"]' );
        var $menu = $group.find( '> .menu' );
        var $items = $menu.find( '> li' );

        var componentKey = $group.attr( 'data-component' );
        var moduleKey = $group.attr( 'data-module' );
        var node = toolbars.selectedNode;

        var isGroupForNode = componentKey === node.key || ( components[ node.key ].modules && components[ node.key ].modules[ moduleKey ] )

        //hack to support template editing mode
        if( $group.is( '[data-key="template"]' ) ){
          isGroupForNode = true;
        }

        if( !isGroupForNode ) return;

        group.init( toolbars.selectedNode, group.items, components );

        if( group.type === 'select-single' ){
          $items.removeClass( 'selected' );
        }

        Object.keys( group.items ).forEach( itemKey => {
          const item = group.items[ itemKey ]
          var $item = $menu.find( '> li[data-key="' + itemKey + '"]' );

          if( group.type === 'input' || group.type === 'select-multiple' ){
            $item.replaceWith( makeItem( $menu, tab, group, item ) );
          }

          if( group.type === 'select-single' && item.selected ){
            $item.addClass( 'selected' );
          }
        });
      }
    });
  }

  function toggle( key, isEnabled ){
    var $tabHeader = $container.find( '> [data-toolbar-tab-headers] > li > [data-key="' + key + '"]' );
    $tabHeader.toggleClass( 'disabled', !isEnabled );

    if( !isEnabled ) $tabHeader = $container.find( '> [data-toolbar-tab-headers] > li > [data-key="' + toolbars.lastSelectedTab + '"]' );

    $tabHeader.trigger( 'click' );
  }

  function makeItem( $menu, tab, group, item ){
    var $item = templates[ group.template ]( item );

    var eventInitialisers = {
      'select-single' : function(){
        $item.click( function(){
          if( !$item.is( '.disabled' ) && toolbars.click( tab, group, item ) ){
            $menu.find( '.selected' ).removeClass( 'selected' );
            $item.addClass( 'selected' );
          }
          return false;
        });

        if( item.selected ){
          $item.trigger( 'click' );
        }
      },
      'select-multiple' : function(){
        $item.click( function(){
          if( !$item.is( '.disabled' ) && toolbars.click( tab, group, item ) ){
            $item.toggleClass( 'selected', item.selected );
          }
          return false;
        });
      },
      'button': function(){
        $item.on( 'mousedown', function(){
          if( !$item.is( '.disabled' ) ){
            toolbars.click( tab, group, item );
          }
          return false;
        });
      },
      'input': function(){
        var $input = $item.find( 'input' );
        $input.on( 'change', function(){
          if( group.change ){
            var value = $input.is( '[type="checkbox"]' ) ? $input.is( ':checked' ) : $input.val();

            group.change( item, toolbars.selectedNode, value, toolbars.onUpdateNode, $item );
          }
        });
      }
    };

    if( eventInitialisers[ group.type ] ) eventInitialisers[ group.type ]()

    return $item;
  }

  toolbars.show = function( key, filterAttributes ){
    if( filterAttributes ){
      var $groups = $container.find( '> [data-toolbar-tab][data-key="' + key + '"] > [data-toolbar-group]' );

      var visibleGroupCount = 0;

      $groups.each( function(){
        var $group = $( this );

        var isMatch = filterAttributes.some( function( item ){
          //added to allow showing template
          if( item.key === item.value ){
            var keySelector = '[data-key="' + item.key + '"]';
            return $group.is( keySelector );
          }

          var attributeSelector = '[data-' + item.key + '="' + item.value + '"]';
          return $group.is( attributeSelector );
        });

        $group.toggle( isMatch );

        visibleGroupCount += isMatch ? 1 : 0;
      });

      if( visibleGroupCount === 0 ) return;
    }

    toggle( key, true );
  };

  toolbars.hide = function( key ){
    toggle( key, false );
  };

  var tabs = utils.arrayify( toolbars.tabs )

  tabs.forEach( function( tab ){
    tab.selected = tab.key === toolbars.selectedTab
  })

  var $headers = templates[ 'toolbar-tab-headers' ]({
    items: tabs
  });

  var $headerActions = $headers.find( 'a' );

  $headerActions.click( function(){
    var $a = $( this );
    var key = $a.attr( 'data-key' );

    var isDisabled = $a.hasClass( 'disabled' );
    var isCurrent = toolbars.selectedTab === key;

    if( isDisabled || isCurrent ) return false;

    $headerActions.removeClass( 'selected' );
    $a.addClass( 'selected' );

    toolbars.lastSelectedTab = toolbars.selectedTab;
    toolbars.selectedTab = key;

    var $tabs = $container.find( '> [data-toolbar-tab]' );
    var $tab = $container.find( '> [data-toolbar-tab][data-key="' + key + '"]' );

    $tabs.removeClass( 'selected' );
    $tab.addClass( 'selected' );

    initTab( key, $tab );

    return false;
  });

  $container.html( $headers );

  tabs.forEach( function( tab ){
    var $tab = templates[ 'toolbar-tab' ]( tab );

    var groups = utils.arrayify( tab.groups )

    groups.forEach( function( group ){
      var items = utils.arrayify( group.items )

      if( items.length > 0 ){
        var $group = templates[ 'toolbar-group' ]( group );

        var $menu = $group.find( '> .menu' );

        items.forEach( function( item ){
          var $item = makeItem( $menu, tab, group, item );

          $menu.append( $item );
        });

        $tab.append( $group );
      }
    });

    $container.append( $tab );
  });
}

function toolbarClick( tab, group, item ){
  var tabHandler = toolbarHandlers[ tab.key ]

  if( typeof tabHandler === 'function' ){
    tabHandler( group, item, toolbars.selectedNode, toolbars.onUpdateNode, toolbars.$selected, components );

    return true;
  }

  var groupHandler = tabHandler[ group.key ];

  if( typeof groupHandler === 'function' ){
    groupHandler( item, toolbars.selectedNode, toolbars.onUpdateNode, toolbars.$selected, components );

    return true;
  }

  var itemHandler = groupHandler[ item.key ];

  itemHandler( toolbars.selectedNode, toolbars.onUpdateNode, toolbars.$selected, components );

  return true;
}

module.exports = toolbars;

