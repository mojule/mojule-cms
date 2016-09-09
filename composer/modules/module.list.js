var $ = require( '../$' )
var templates = require( '../templates' )
var persistence = require( '../persistence' )
var formViewModels = require( '../form-view-models' )
var dialogs = require( '../dialogs' )( $, templates, persistence, formViewModels )

module.exports = {
  name: 'List',
  icon: 'list',
  editor: {
    tab: 'edit',
    groups: {
      'edit-list': {
        title: 'List',
        type: 'button',
        template: 'toolbar-icon',
        items: {
          'list': {
            icon: 'list',
            title: 'Edit List'
          }
        },
        click: function( item, node, callback, $el, components ){
          var values = Array.isArray( node.values.items ) ? node.values.items : []

          dialogs.getValue( 'list', values, function( values ){
            if( Array.isArray( values ) ){
              node.values.items = values
            }
            callback( node )
          })
        }
      }
    }
  }
}
