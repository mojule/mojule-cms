module.exports = function( $, templates, persistence, formViewModels ){
  return {
    id: 'list-dialog',
    title: 'List',
    template: 'list-dialog',
    type: 'ok-cancel',
    values: {
      items: []
    },
    init: function( $dialog, items ){
      var ListModel = formViewModels.list

      var listModel = ListModel({})

      var body = { items: items }

      var options = {
        submit: false
      }

      var form = listModel.form( options, body )

      var $form = templates.form( { form } )

      var $list = $dialog.find( '#list' )

      $list.html( $form )

      var modelForm = $list.find( '.modelForm' ).get( 0 )

      window.mojule.listify( modelForm )
    },
    getData: function( $dialog ){
      var values = []

      var $inputs = $dialog.find( '.array input' )

      $inputs.each( function(){
        var $input = $( this )

        var val = $input.val().trim()

        if( val !== '' ) values.push( val )
      })

      return values
    }
  };
};