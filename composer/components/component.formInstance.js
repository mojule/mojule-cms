module.exports = function( $, templates, persistence ){
  var dialogs = require( '../dialogs' )( $, templates, persistence )

  return {
    name: 'Form',
    icon: 'edit',
    values: {
      html: ''
    },
    onAdd: function( root, node, callback ){
      persistence.get( 'form', function( err, forms ){
        if( err ) throw err

        if( forms.length === 0 ) return;

        dialogs.getValue( 'form', forms, function( id ){
          if( id && id !== '' ){
            node.values.formId = id

            persistence.load( id, function( err, form ){
              node.values.html = form.name
              callback( true )
            })
          }
        })
      })
    },
    render: function( components, node, $el, callback, options ){
      persistence.load( node.values.formId, function( err, form ){
        if( err ) throw err

        const formViewModel = form.values.form

        if( options && options.page ){
          formViewModel.fields.push({
            input: 'hidden',
            name: 'returnId',
            value: options.page
          })
        }

        $el.html( templates[ 'form' ]( { form: formViewModel } ) )

        if( callback ){
          callback( $el )
        }
      })
    }
  }
}