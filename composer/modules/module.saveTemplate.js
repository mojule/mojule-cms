var $ = require( '../$' );
var templates = require( '../templates' );
var persistence = require( '../persistence' );
const Tree = require( '../../src/tree' )

module.exports = {
  name: 'Save to Template',
  icon: 'floppy-o',
  editor: {
    tab: 'edit',
    groups: {
      'save-template': {
        title: 'Save to Template',
        type: 'button',
        template: 'toolbar-icon',
        items: {
          'save': {
            icon: 'floppy-o',
            title: 'Save'
          }
        },
        click: function( item, node, callback, $el, components ){
          const api = require( '../component-api' )( $, templates, persistence, components )

          var newTitle = window.prompt( 'Template name?', 'New Template' );
          if( newTitle ){
            var template = api.createNode( 'template' )

            template.name = template.values.name = newTitle
            template.children = node.children

            Tree( template ).walk( function( node ){
              node.values.isLocked = true
            })

            persistence.save( template, function( err ){
              if( err ) throw err
            })
          }
        }
      }
    }
  }
}
