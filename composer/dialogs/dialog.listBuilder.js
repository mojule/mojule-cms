'use strict'

module.exports = ( $, templates, persistence, formViewModels ) => {
  const dialog = {
    id: 'list-builder',
    title: 'List Builder',
    template: 'list-builder-dialog',
    type: 'app',
    isOkCancel: true,
    values: {
      items: []
    },
    init: function( $dialog, model ){
      if( model.title ){
        const $header = $dialog.find( 'h1' )
        $header.text( model.title )
      }

      const $itemsContainer = $dialog.find( '.items' )

      const $flexLibrary = templates[ 'filter-flex-library' ]( model )

      $itemsContainer.append( $flexLibrary )

      const $selectionContainer = $dialog.find( '.selection' )

      const $selection = templates[ 'list-builder-selection' ]( model.library )

      $selectionContainer.append( $selection )

      const $selectedItems = $selectionContainer.find( '.selected-item' )

      const $libraryItems = $flexLibrary.find( 'li' )

      dragula( [ $selectionContainer.get( 0 ) ] )

      const removeSelectedItem = ( $item ) => {
        const id = $item.attr( 'data-id' )

        $item.remove()

        const $libraryItem = $flexLibrary.find( '[data-id="' + id + '"]' )

        $libraryItem.removeClass( 'selected' )
      }

      //don't refactor to arrow lambda! requires function for scope of 'this'
      $selectedItems.each( function(){
        const $item = $( this )

        const $remove = $item.find( '.button' )

        $remove.click( () => {
          removeSelectedItem( $item )
        })
      })

      $libraryItems.each( function(){
        const $item = $( this )
        const id = $item.attr( 'data-id' )

        $item.click( () => {
          $item.toggleClass( 'selected' )

          //just selected it now
          if( $item.is( '.selected' ) ){
            const model = {
              title: $item.attr( 'title' ),
              icon: $item.attr( 'data-icon' ),
              data: [
                {
                  key: 'id',
                  value: id
                }
              ]
            }

            const $selectionItem = templates[ 'list-builder-selection-item' ]( model )

            $selectionContainer.append( $selectionItem )

            const $remove = $selectionItem.find( '.button' )

            $remove.click( () => {
              removeSelectedItem( $selectionItem )
            })
          } else {
            const $selectionItem = $selectionContainer.find( '[data-id="' + id + '"]' )

            $selectionItem.remove()
          }
        })
      })
    },
    getData: function( $dialog ){
      const values = []

      const $selectionContainer = $dialog.find( '.selection' )
      const $selectedItems = $selectionContainer.find( '.selected-item' )

      $selectedItems.each( function(){
        const $item = $( this )

        values.push( $item.attr( 'data-id' ) )
      })

      return values
    }
  }

  return dialog
}
