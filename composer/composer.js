var componentOptions = {};
var consts = window.consts

if( consts && consts.page ){
  componentOptions.page = consts.page;
}

var $ = require( './$' )
var ich = require( './templates' )
var persistence = require( './persistence' )
var formViewModels = require( './form-view-models' )
var modules = require( './modules' )
var dialogs = require( './dialogs' )( $, ich, persistence, formViewModels )
var toolbars = require( './toolbars' )
var components = require( './components' )( $, ich, persistence, componentOptions )
var ComponentApi = require( './component-api' )
var utils = require( '../src/utils/utils' )
var Tree = require( '../src/tree' )

var api = ComponentApi( $, ich, persistence, components, componentOptions )
var events = api.Events( modules )

require( '../polyfills' )

var restoreTemplates = require( './block-processor' )( persistence )

var $iframe
var $iBody
var $page
var $toolbarContainer
var htmlDocument
var state

var init = function(){
  $iframe = $( '#composer-viewport' )

  if( $iframe.length === 0 ) return

  htmlDocument = {
    root: api.createNode( 'document' ),
    cache: {},
    selectedNodeId: null
  }

  state = {
    dragData: {},
    displayMode: 'large',
    create: consts.toolbarComponents,
    breakPoints: {
      large: 1024,
      medium: 800,
      small: 320
    },
    pollId: null
  }

  /*
    temporary x-browser warning - use firefox until thoroughly tested!
  */
  var isFirefox = typeof InstallTrigger !== 'undefined'

  if( !isFirefox ){
    window.alert( 'Warning! There are known issues when using browsers other than Firefox - these will be fixed in time, but until then please use Firefox for composing pages' )
  }

  $iframe.load( function(){
    $toolbarContainer = $( '[data-toolbars]' )
    $( window ).resize( iframeSize )

    window.IMedium = $iframe[ 0 ].contentWindow.IMedium

    $iBody = $iframe.contents().find( 'body' )
    $page = $iBody.find( '.page' )
    $page.attr( 'data-type', consts.type )

    persistence.load( consts.id, function( err, document ){
      restoreTemplates( document, function(){
        htmlDocument.root = document

        rebuildDom()

        initDragEvents( $iframe )

        createToolbars()

        preventNavigate()

        $( window ).trigger( 'resize' )

        //initDebuggy()
      })
    })
  })
}

const initDebuggy = () => {
  const $pre = debuggy( $iBody )

  setInterval( () => {
    const vals = Object.keys( htmlDocument.cache ).filter( key => {
      return htmlDocument.cache[ key ].key === 'column'
    }).map( key => {
      return {
        key,
        values: htmlDocument.cache[ key ].values
      }
    })


    $pre.text( JSON.stringify( vals, null, 2 ) )
  }, 100 )
}

function iframeSize(){
  var windowWidth = $( window ).width()

  var width = state.breakPoints[ state.displayMode ]

  if( state.displayMode === 'large' && windowWidth >= width ) width = windowWidth

  var $header = $( 'body > header' )
  //the extra 20 ensures some leeway as sometimes it doesn't appear to measure the horizontal scrollbar
  var height = $header.outerHeight() + 20
  var left = ( windowWidth - width ) / 2

  if( left < 0 ) left = 0

  $iframe.css({
    position: 'absolute',
    width: width,
    left: left,
    top: height,
    height: $( window ).height() - height
  })
}

function preventNavigate(){
  $iBody.on( 'click', 'a:not( .tab-title a ), .page input', function(){
    return false;
  });
}

/* start dom stuff */

function rebuildDom( shouldSave ){
  var createdCallbacks = [];

  $page.html( nodeToEl( htmlDocument.root, createdCallbacks ) );

  $iframe[ 0 ].contentWindow.refreshFoundation();

  createdCallbacks.forEach( callback => callback() )

  if( shouldSave ){
    save();
  }
}

function nodeToEl( node, callbacks ){
  htmlDocument.cache[ node._id ] = node;

  //we want a callback
  var $el = createComponent( node );

  if( api.isContainer( node.key ) ){
    var $container = getContainer( $el );

    node.children.forEach( child => {
      var $child = nodeToEl( child, callbacks )
      $container.append( $child )
    })

    if( node.children.length === 0 ){
      $container.attr( 'data-leaf', true )
      $el.attr( 'data-leaf', true )
    }
  } else {
    $el.attr( 'data-leaf', true )
  }

  callbacks.push( () => {
    events.onCreatedEl( node, $el, selectById )
  })

  return $el
}

function elToNode( $el ){
  var node = nodeFromEl( $el );
  var id = node._id;

  events.onBeforeElToNode( node, $el )

  if( api.isContainer( node.key ) ){
    var $container = getContainer( $el );

    var newChildren = [];

    var $children = $container.find( '> [data-component]' );

    $children.each( function(){
      var $child = $( this );
      var childNode = elToNode( $child );
      newChildren.push( childNode );
    });

    node.children = newChildren;
  }

  return node;
}

function nodeFromEl( $el ){
  return nodeFromId( $el.attr( 'data-id' ) );
}

function canMove( node ){
  if( consts.type !== 'template' && isLocked( node ) ) return false

  if( node.values.preventMove ) return false;

  if( consts.type !== 'template' && node.values.fromTemplate ) return false;

  return true;
}

function isLocked( node ){
  if( node.values.isLocked ) return true

  if( consts.restrict ){
    if( !Array.isArray( node.values.editors ) ) return true

    return !node.values.editors.includes( consts.user )
  }

  return false
}

function createComponent( node ){
  var $el = createElement( node );

  var isRestricted = consts.restrict && isLocked( node )

  if( !$el.is( '[data-root]' ) ){
    var wrapperValues = Object.assign(
      {},
      components[ node.key ],
      node,
      {
        name: api.headerText( node )
      }
    )

    if( !$el.is( '[data-component]' ) ){
      $el = ich.component( wrapperValues ).append( $el );

      if( consts.type !== 'template' && isLocked( node ) ){
        $el.attr( 'data-locked', true )
      }
    }

    if( isRestricted ){
      $el.attr( 'data-restricted', true )
    }

    $el.prepend( ich.componentHeader( wrapperValues ) );

    createComponentHeaderActions( $el );
  }

  $el.attr( 'data-id', node._id );
  $el.attr( 'data-key', node.key );

  if( !canMove( node ) ){
    $el.attr( 'data-immovable', true );
  }

  return $el;
}

function createElement( node ){
  events.onCreatingEl( node )

  updateNodeCache( node )

  var $el = api.toEl( node, true )

  $el.attr( 'data-element', true );

  if( consts.type !== 'template' && isLocked( node ) ){
    $el.attr( 'data-locked', true )
  }

  if( !isLocked( node ) || consts.type === 'template' ){
    events.onCreateEl( node, $el, selectById )
  }

  return $el;
}

function updateNodeCache( node ){
  Tree( node ).walk( n => {
    htmlDocument.cache[ n._id ] = n
  })
}

function selectById( id ){
  htmlDocument.selectedNodeId = id;
  select( true );
}

function select( isEdit ){
  if( htmlDocument.selectedNodeId ){
    var node = nodeFromId( htmlDocument.selectedNodeId );
    var component = components[ node.key ];

    if( component.selectParent ){
      var parentNode = Tree( htmlDocument.root ).parent( node )

      htmlDocument.selectedNodeId = parentNode._id;

      select( isEdit );

      return;
    }
  }

  deselectAll();

  var $selected = selectedComponent();

  if( $selected.length === 0 ) return;

  $selected.find( '[data-header]' ).first().addClass( 'selected' );

  if( $selected.is( '[data-component]' )){
    $selected.addClass( 'selected' )
  }

  if( isEdit ) {
    onSelect( htmlDocument.selectedNodeId )
  }
}

function nodeFromId( id ){
  return htmlDocument.cache[ id ];
}

function deselectAll(){
  $iBody.find( '[data-header], [data-component]' ).removeClass( 'selected' );

  toolbars.hide( 'edit' );
}

function selectedComponent(){
  return $iBody.find( '[data-id="' + htmlDocument.selectedNodeId + '"]' );
}

function onSelect( id ){
  var node = nodeFromId( id );

  if( isLocked( node ) && consts.type !== 'template' ){
    return;
  }

  editToolbar( node );

  var $el = elFromId( id );

  var component = components[ node.key ];

  if( component.onSelect ){
    component.onSelect( node, $el );
  }

  if( component.modules ){
    Object.keys( component.modules ).forEach( key => {
      var module = modules[ key ];

      if( module.onSelect ){
        module.onSelect( node, $el )
      }

      if( module.poll ){
        if( state.pollId ){
          clearInterval( state.pollId )
        }
        state.pollId = setInterval( function(){
          module.poll.on( node, $el )
        }, module.poll.delay )
      }
    })
  }
}

function elFromId( id ){
  return $iBody.find( '[data-id="' + id + '"]' );
}

function createComponentHeaderActions( $el ){
  var $component = getComponent( $el );
  var $header = $component.find( '> [data-header]' );
  var $delete = $header.find( '[data-action="delete"]' );

  $delete.click( function(){
    if( window.confirm( 'Do you really want to delete this?' )){
      $el.remove();
      htmlDocument.selectedNodeId = null;
      changed();
    }
  });

  var $toggle = $header.find( '[data-action="toggle"]' );

  $toggle.click( function(){
    var currentState = $toggle.attr( 'data-state' );
    var newState = currentState === 'up' ? 'down' : 'up';

    $toggle.attr( 'data-state', newState );

    $component.toggleClass( 'collapsed', newState === 'down' );
  });
}

function getContainer( $el ){
  return $el.is( '[data-container]' ) ? $el : $el.find( '[data-container]' ).first();
}

function getComponent( $el ){
  return $el.closest( '[data-component]' );
}

function changed(){
  rebuildNodes()

  if( state.dragData.isNew ){
    api.onAdd( htmlDocument.root, state.dragData.end.node, rebuildDom )
  }

  if( state.dragData.isWrapped ){
    var wrapperNode = Tree( htmlDocument.root ).parent( state.dragData.end.node )

    api.onAdd( htmlDocument.root, wrapperNode, rebuildDom )
  }

  rebuildDom( true )
}

function save( preventSelect ){
  persistence.save( htmlDocument.root, function(){
    if( !preventSelect ) select( true )
  })
}

function rebuildNodes(){
  htmlDocument.root = elToNode( getRoot() )

  if( consts.type === 'template' ){
    Tree( htmlDocument.root ).walk( node => {
      if( typeof node.values.isLocked === 'undefined' ){
        node.values.isLocked = true
      }
    })
  }

  rebuildNodeCache()
}

function rebuildNodeCache(){
  htmlDocument.cache = {};
  updateNodeCache( htmlDocument.root );
}

function editToolbar( node ){
  var component = components[ node.key ]

  var $selectedComponent = selectedComponent()
  var $selectedElement = $selectedComponent.find( '> [data-element]' )

  toolbars.selectedNode = node
  toolbars.onUpdateNode = updateSelectedElement
  toolbars.$selected = $selectedElement

  var filters = [
    {
      key: 'component',
      value: node.key
    }
  ]

  if( component.modules ){
    Object.keys( component.modules ).forEach( moduleKey => {
      filters.push({
        key: 'module',
        value: moduleKey
      })
    })
  }

  if( consts.type === 'template' ){
    filters.push({
      key: 'template',
      value: 'template'
    })
  }

  toolbars.show( 'edit', filters )
}

function updateSelectedElement( node, preventSelect ){
  var $selectedComponent = selectedComponent()

  var createdCallbacks = []

  var $new = nodeToEl( node, createdCallbacks )

  $selectedComponent.replaceWith( $new )

  $iframe[ 0 ].contentWindow.refreshFoundation()

  createdCallbacks.forEach( callback => callback() )

  $iframe[ 0 ].contentWindow.refreshFoundation()

  save( preventSelect )
}

/* end dom stuff */

/* start drag stuff */
function initDragEvents( $iframe ){
  var $window = $( window );
  var $iWindow = $( $iframe[ 0 ].contentWindow );

  var $windows = $window.add( $iWindow );

  var startDrag;

  $windows.on( 'mousedown', function( e ){
    if( getComponentAtEvent( e ).length > 0 ){
      deselect();
    }

    checkDeselect( e );

    dragMoveStart( e );
    dragCreateStart( e );
  });

  $windows.on( 'mousemove', function( e ){
    if( Object.keys( state.dragData ).length )
      dragging( e )
  });

  $windows.on( 'mouseup', function( e ){
    if( Object.keys( state.dragData ).length )
      finalizeDrag()
  });

  scroller.$el = $iframe.contents().find( 'html, body' );
  scroller.$container = $iWindow;
}

function getComponentAtEvent( e ){
  var $action = getActionAtEvent( e );

  if( $action.length > 0 ) return $();

  var $header = getHeaderElementAtEvent( e );

  if( $header.length > 0 ){
    var $component = $header.closest( '[data-component]' );

    if( $component.length > 0 ){
      return $component;
    }
  }

  return $();
}

function getActionAtEvent( e ){
  return $( e.target ).closest( '[data-action]' );
}

function getHeaderElementAtEvent( e ){
  return $( e.target ).closest( '[data-header]' );
}

function deselect(){
  if( state.pollId ){
    clearInterval( state.pollId );
  }

  if( htmlDocument.selectedNodeId ){
    var id = htmlDocument.selectedNodeId;
    var node = nodeFromId( id );

    var $el = elFromId( id );

    var component = components[ node.key ];

    if( component.onDeselect ){
      component.onDeselect( node, $el )
    }

    if( component.modules ){
      Object.keys( component.modules ).forEach( key => {
        var module = modules[ key ]

        if( module.onDeselect ){
          var isSave = module.onDeselect( node, $el )
          if( isSave ){
            save( true )
          }
        }
      })
    }
  }
  htmlDocument.selectedNodeId = null;
}

function checkDeselect( e ){
  var $target = $( e.target );
  if( $target.is( '[data-deselect]' ) ){
    deselect();
    select();
  }
}

function dragMoveStart( e ){
  var $component = getComponentAtEvent( e );

  if( $component.length === 0 ) return;

  var nodeId = $component.attr( 'data-id' );

  var node = nodeFromId( nodeId );

  if( !canMove( node ) ) return;

  var parentNode = Tree( htmlDocument.root ).parent( node )
  var index = parentNode.children.indexOf( node )

  dragStart( e )

  state.dragData.start = {
    node: node,
    parentId: parentNode._id,
    index: index,
    time: Date()
  };

  state.dragData.end = utils.clone( state.dragData.start )

  $component.remove()

  updatePreview()
}

function dragStart( e ) {
  e.preventDefault()
  preventSelectionWhileDragging()
}

function updatePreview(){
  var $preview = $iBody.find( '.preview' )

  $preview.remove()

  var parentNode = Tree( htmlDocument.root ).find( n => n._id === state.dragData.end.parentId )

  if( !parentNode ) return

  var node = api.wrapNode( state.dragData.end.node, parentNode.key )

  state.dragData.isWrapped = node !== state.dragData.end.node

  var createdCallbacks = []

  $preview = nodeToEl( node, createdCallbacks ).addClass( 'preview' )

  var $target = $iBody.find( '[data-id="' + state.dragData.end.parentId + '"]' )

  var $container = getContainer( $target )

  $container.insertAt( $preview, state.dragData.end.index )

  createdCallbacks.forEach( callback => callback() )
}

function dragCreateStart( e ){
  var $createElement = getCreateElementAtEvent( e );

  if( $createElement.length === 0 ) return;

  dragStart( e );

  selectCreateElement( $createElement );

  var startKey = getCreateSourceKey();

  state.dragData.isNew = true;

  var node = api.createNode( startKey )

  if( consts.restrict ){
    if( !Array.isArray( node.values.editors ) ){
      node.values.editors = []
    }
    if( !node.values.editors.includes( consts.user ) ){
      node.values.editors.push( consts.user )
    }
  }

  state.dragData.start = {
    node: node,
    parentId: htmlDocument.root._id,
    index: htmlDocument.root.children.length,
    time: Date()
  };

  state.dragData.end = utils.clone( state.dragData.start )

  updatePreview();
}

function dragging( e ){
  if( state.dragData.start.node.values.preventMove ) return

  scroller.setDelta( e )

  draggingCuesOn( state.dragData.isNew ? 'create' : 'move' )

  var $target = getTargetAtEvent( e )

  if( $target.length > 0 ){
    var targetNode = nodeFromEl( $target )

    if( !targetNode || $target.is( '.preview' ) ) return

    var dropzone = $target.is( '[data-root]' ) ? 'inside' : getDropzone( $target, e )

    if( dropzone !== 'none' ){
      var parentNode = getParentNode( $target, dropzone )
      var dropIndex = getDropIndex( $target, dropzone )

      if( parentNode._id === state.dragData.end.parentId && dropIndex === state.dragData.end.index ) return

      var node = api.wrapNode( state.dragData.start.node, parentNode.key )

      if( api.canPlace( parentNode.key, node.key ) ){
        state.dragData.end.parentId = parentNode._id
        state.dragData.end.index = dropIndex

        updatePreview()
      }
    }
  }
}

function finalizeDrag(){
  scroller.setDelta( 0 )

  restoreTextSelection()
  draggingCuesOff()

  var $preview = $iBody.find( '.preview' )
  $preview.removeClass( '.preview' )

  deselect()

  if( !state.dragData.isNew && notMoved() ){
    htmlDocument.selectedNodeId = state.dragData.end.node._id
  }

  select()

  changed()

  state.dragData = {}
}

function notMoved(){
  return state.dragData.start.parentId === state.dragData.end.parentId && state.dragData.start.index === state.dragData.end.index;
}

function getDropzone( $el, e ){
  var offset = $el.offset();
  var top = e.pageY - offset.top;
  var left = e.pageX - offset.left;

  var node = nodeFromEl( $el );

  if( node.values.fromTemplate ){
    if( node.key === 'box' && !isLocked( node ) ){
      return 'inside';
    }
    return 'none';
  }

  if( consts.type !== 'template' && isLocked( node ) ){
    return 'none'
  }

  var start = api.isVertical( node.key ) ? left : top;
  var end = api.isVertical( node.key ) ? $el.width() : $el.height()
  var distance = end >= 66 ? 22 : end / 3;

  var dropzoneTest = {
    before: () => start <= distance,

    after: () => start >= end - distance,

    inside: () => {
      if( !api.isContainer( node.key ) ) return false

      var $container = getContainer( $el )
      var hasChildren = $container.children( '[data-component]:visible' ).length > 0

      if( !hasChildren ) return true

      if( !api.isNonEmptyDropzone( node.key ) ) return false

      return start > distance && start < end - distance
    },

    none: () => true
  }

  return Object.keys( dropzoneTest ).find( key => dropzoneTest[ key ]() )
}

function getDropIndex( $target, dropzone ){
  var targetNode = nodeFromEl( $target )

  if( dropzone === 'inside' ){
    return targetNode.children.length
  }

  var parentNode = getParentNode( $target, dropzone )

  var index = parentNode.children.indexOf( targetNode )

  if( dropzone === 'after' ){
    index++
  }

  return index
}

function getRoot(){
  return $iBody.find( '[data-root]' ).first()
}

function getParentNode( $el, dropzone ){
  var $container = getContainer( $el );

  var $parentContainer =
    dropzone === 'inside' ?
      $container :
      $el.closest( '[data-container]' );

  var $parentElement =
    dropzone === 'inside' ?
      $el :
      $parentContainer.closest( '[data-component]' );

  return nodeFromEl( $parentElement );
}

function preventSelectionWhileDragging(){
  $( 'body' ).addClass( 'noselect' );
  $iBody.addClass( 'noselect' );
}

function getCreateElementAtEvent( e ){
  return $( e.target ).closest( '[data-type="drag"] [data-key]' );
}

function getTargetAtEvent( e ){
  var $eventTarget = $( e.target );
  var $targetComponent = $eventTarget.closest( '[data-component]:not( .preview ):not( [data-root] )' );

  return $targetComponent;
}

function selectCreateElement( $createElement ){
  $( '[data-key="create"] .menu li' ).removeClass( 'selected' );
  $createElement.addClass( 'selected' );
}

function getCreateSourceKey(){
  return $( '[data-key="create"] .menu li.selected' ).attr( 'data-key' );
}

function draggingCuesOn( type ){
  var classes = 'dragging dragging-' + type;
  $( 'body' ).addClass( classes );
  $iBody.addClass( classes );
}

function draggingCuesOff(){
  var classes = 'dragging dragging-move dragging-create';
  $( 'body' ).removeClass( classes );
  $iBody.removeClass( classes );
  $( '[data-key="create"] .menu li' ).removeClass( 'selected' );
}

function restoreTextSelection(){
  $( 'body' ).removeClass( 'noselect' );
  $iBody.removeClass( 'noselect' );
}

/* end drag */

/* start toolbars */

function createToolbars(){
  createFileTabHandlers();
  createViewTabHandlers();
  addDragToCreateToolbar();
  addTemplateEditors();
  addComponentEditors();
  addModuleEditors();

  toolbars.update( $toolbarContainer );

  return;
}

function createFileTabHandlers(){
  toolbars.clickHandlers.file = {
    store: function( item ){
      if( item.key === 'save' ){
        changed()
      } else if ( item.key === 'publish' ){
        alert( 'Not implemented' )
      }
    }
  }
}

function createViewTabHandlers(){
  toolbars.clickHandlers.view = {};
  createDisplayModeHandler();

  toolbars.clickHandlers.view.preview = function(){
    dialogs.getValue( 'preview', {
      root: htmlDocument.root,
      size: state.breakPoints[ state.displayMode ],
      components: components
    }, function(){} );
  };
}

function addDragToCreateToolbar(){
  state.create.forEach( key => {
    var component = components[ key ]

    toolbars.tabs.create.groups[ 'add-new' ].items[ key ] = {
      title: component.name,
      icon: component.icon
    }
  })
}

function addComponentEditors(){
  var editors = getEditors( components )

  Object.keys( editors ).forEach( editorKey => {
    var editor = editors[ editorKey ]

    Object.keys( editor.groups ).forEach( groupKey => {
      var group = editor.groups[ groupKey ]
      group.componentKey = editor.hostKey
    })

    var tab = toolbars.tabs[ editor.tab ]
    tab.groups = Object.assign( tab.groups, editor.groups )

    Object.keys( editor.groups ).forEach( groupKey => {
      var group = editor.groups[ groupKey ]
      toolbars.clickHandlers[ editor.tab ][ groupKey ] = group.click
    })
  })
}

function addModuleEditors(){
  var editors = getEditors( modules )

  var editorKeys = Object.keys( editors )

  editorKeys.reverse()

  editorKeys.forEach( editorKey => {
    var editor = editors[ editorKey ]

    Object.keys( editor.groups ).forEach( groupKey => {
      var group = editor.groups[ groupKey ]
      group.moduleKey = editor.hostKey
    })

    var tab = toolbars.tabs[ editor.tab ]
    tab.groups = Object.assign( tab.groups, editor.groups )

    Object.keys( editor.groups ).forEach( groupKey => {
      var group = editor.groups[ groupKey ]
      toolbars.clickHandlers[ editor.tab ][ groupKey ] = group.click
    })
  })
}

function addTemplateEditors(){
  if( consts.type !== 'template' ) return;

  var groups = {
    "template": {
      title: 'Template Settings',
      type: 'input',
      template: 'toolbar-switch',
      items: {
        isLocked: {
          _id: '_is-locked',
          title: 'Locked',
          checked: true
        }
      },
      change: function( item, node, value, callback, $el ){
        if( item.key === 'isLocked' ){
          node.values.isLocked = value;

          if( !node.values.isLocked ){
            Tree( node ).walk( n => {
              n.values.isLocked = false
            })
          }

          callback( node )
        }
      },
      init: function( node, items ){
        items.isLocked.checked = node.values.isLocked;
      }
    }
  };

  var tab = toolbars.tabs[ 'edit' ];
  tab.groups = Object.assign( tab.groups, groups )

  Object.keys( groups ).forEach( groupKey => {
    var group = groups[ groupKey ]

    toolbars.clickHandlers[ 'edit' ][ groupKey ] = group.click
  })
}

function createDisplayModeHandler(){
  toolbars.clickHandlers.view[ 'display-mode' ] = function( item ){
    if( state.displayMode === item.key ) return;

    state.displayMode = item.key;
    $( window ).trigger( 'resize' );
  };
}

function getEditors( host ){
  Object.keys( host ).forEach( key => {
    var value = host[ key ]
    value.key = key
  })

  var editors = Object.keys( host ).reduce( ( editors, key ) => {
    var item = host[ key ]

    item.key = key

    if( item.editor ){
      item.editor.hostKey = item.key
      editors[ key ] = item.editor
    }

    return editors
  }, {} )

  return editors
}

/* end toolbars */

const debuggy = $parent => {
  let $debuggy = $parent.find( '#debuggy' )
  let $pre

  if( $debuggy.length ){
    $pre = $debuggy.find( 'pre' )
  } else {
    $debuggy = $( '<div id="debuggy"></div>' )

    $debuggy.css({
      background: '#39f',
      color: 'white',
      opacity: 0.8,
      position: 'fixed',
      top: 60,
      right: 0,
      bottom: 60,
      width: '35em',
      overflow: 'scroll',
      fontSize: '0.7rem'
    })

    $pre = $( '<pre></pre>' )

    $debuggy.append( $pre )

    $parent.append( $debuggy )
  }

  return $pre
}

module.exports = init
