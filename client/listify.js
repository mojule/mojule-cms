const listify = modelForm => {
  const arrays = Array.from( modelForm.querySelectorAll( '.array' ) )

  const removeListItem = e => {
    e.preventDefault()

    const target = e.target
    const item = target.closest( 'li' )
    const list = target.closest( 'ul' )

    list.removeChild( item )
  }

  const addListItem = ( list, html ) => {
    const item = document.createElement( 'li' )

    item.innerHTML = html

    list.appendChild( item )

    const removeButton = item.querySelector( 'button.remove' )

    removeButton.onclick = removeListItem
  }

  arrays.forEach( arrayEl => {
    const addButton = arrayEl.querySelector( 'button.add' )
    const list = arrayEl.querySelector( 'ul' )
    const item = list.querySelector( 'li[data-template]' )
    const removeButtons = list.querySelectorAll( 'button.remove' )

    Array.from( removeButtons ).forEach(
      removeButton =>
        removeButton.onclick = removeListItem
    )

    const html = item.innerHTML

    addButton.onclick = e => {
      e.preventDefault()
      addListItem( list, html )
    }
  })
}

module.exports = listify