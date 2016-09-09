var $ = require( '../$' )
var templates = require( '../templates' )
var persistence = require( '../persistence' )
var dialogs = require( '../dialogs' )( $, templates, persistence )

module.exports = {
  name: 'Link',
  icon: 'link',
  editor: {
    tab: 'edit',
    groups: {
      'add-link': {
        title: 'Select Link',
        type: 'button',
        template: 'toolbar-icon',
        items: {
          'link': {
            icon: 'link',
            title: 'Select'
          }
        },
        click: function( item, node, callback, $el, components ){
          var values = {
            url: node.values.url ? node.values.url : ''
          }

          dialogs.getValue( 'link', values, function( values ){
            if( values && values.url && values.url !== '' ){
              node.values.url = values.url;
            }
          })
        }
      }
    }
  }
}
