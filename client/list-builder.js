'use strict'

const { dialogs, events } = window.mojule

const checkboxesToListBuilder = ( el, checkboxes ) => {
  const $fieldset = $( el ).closest( 'fieldset' )
  const $legend = $fieldset.find( 'legend' )

  const items = checkboxes.map( input => ({
    title: input.getAttribute( 'data-label' ),
    icon: input.getAttribute( 'data-icon' ),
    id: input.getAttribute( 'value' ),
    selected: input.checked
  }))

  const selected = items.filter( item => item.selected )

  const $textSource = $legend.clone()
  $textSource.find( 'em' ).remove()

  const listBuilderModel = {
    items: selected,
    submitLabel: 'Select ' + $textSource.text()
  }

  const $listBuilder = ich[ 'list-builder' ]( listBuilderModel )

  const $button = $listBuilder.find( '.button' )

  $button.click( () => {
    showDialog( el, checkboxes )
  })

  const selectedItemIds = selected.filter( s => s.selected ).map( s => s.id )

  return $listBuilder
}

const showDialog = ( el, checkboxes ) => {
  const dialogModel = getDialogModel( checkboxes )

  dialogs.getValue( 'listBuilder', dialogModel, selected => {
    if( !selected ){
      return
    }

    updateFromList( el, selected )
  })
}

const updateFromList = ( el, selected ) => {
  const $fieldset = $( el ).closest( 'fieldset' )
  const $listBuilder = $fieldset.find( '.list-builder' )

  const $checkboxes = $( el ).find( '[type="checkbox"]' )

  $checkboxes.each( function(){
    const $checkbox = $( this )
    $checkbox.prop( 'checked', false )
  })

  selected.forEach( id => {
    const $checkbox = $( el ).find( '[value="' + id + '"]' )
    $( el ).append( $checkbox ) //moves to end
    $checkbox.prop( 'checked', true )
  })

  const checkboxes = Array.from( el.querySelectorAll( '[type="checkbox"]' ) )

  $listBuilder.replaceWith( checkboxesToListBuilder( el, checkboxes ) )

  events.emit( 'listbuilderbuilt', selected )
}

const getDialogModel = checkboxes => {
  const items = checkboxes.map( input => {
    const title = input.getAttribute( 'data-label' )
    const icon = input.getAttribute( 'data-icon' )
    const id = input.getAttribute( 'value' )
    const selected = input.checked

    const model = { title, icon, id, selected }

    const data = Object.keys( model ).map( key => {
      return {
        key,
        value: model[ key ]
      }
    })

    model.data = data

    return model
  })

  const dialogModel = {
    title: 'Select Items',
    library: {
      items
    },
    small: true
  }

  return dialogModel
}

const listBuilder = el => {
  const checkboxes = Array.from( el.querySelectorAll( '[type="checkbox"]' ) )

  if( checkboxes.length === 0 ){
    const $fieldset = $( el ).closest( 'fieldset' )
    $fieldset.hide()
    return
  }

  if( checkboxes.length < 6 ){
    if( checkboxes.length > 1 ) dragula( [ el ] )

    return
  }

  const $listBuilder = checkboxesToListBuilder( el,  checkboxes )

  $( el ).after( $listBuilder )
  $( el ).hide()

  const selected = checkboxes.filter( c => c.checked ).map( c => c.getAttribute( 'value' ) )

  events.emit( 'listbuilderbuilt', selected )
}

module.exports = listBuilder
