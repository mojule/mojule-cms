module.exports = function( $, templates, persistence ){
  const dialogs = require( '../dialogs' )( $, templates, persistence )
  const Tree = require( '../../src/tree' )
  const utils = require( '../../src/utils/utils' )

  return {
    name: 'Prefab',
    icon: 'puzzle-piece',
    accepts: '*',
    values: {
      name: 'New Prefab',
      templateId: -1
    },
    onAdd: function( root, node, callback ){
      persistence.get( 'template', function( err, templates ){
        if( err ) throw err

        if( templates.length === 0 ) return

        dialogs.getValue( 'template', templates, function( id ){
          if( id && id !== '' ){
            node.values.templateId = id;

            persistence.load( id, function( err, template ){
              node.children = template.children.slice()

              node.children.forEach( child => {
                Tree( child ).walk( n => {
                  n._templateId = n._id
                  n._id = utils.randomId( n.key )
                  n.values.fromTemplate = true
                })
              })
              callback( true )
            })
          }
        })
      })
    }
  }
}