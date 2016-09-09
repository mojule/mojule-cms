$( () => {
  const { dialogs, events, persistence } = window.mojule
  const Components = require( '../composer/components' )
  const $userSettings = $( '.user-settings' )

  const loadPageStyles = id => {
    const path = '/files/css/' + id
    if( !$( 'link[href="' + path + '"]' ).length )
      $( '<link href="' + path + '" rel="stylesheet">' ).appendTo( 'head' )
  }

  const decorate = () => {
    const $listBuilder = $userSettings.find( '.list-builder' )
    const $pageItems = $listBuilder.find( 'li' )

    $pageItems.each( function(){
      const $item = $( this )
      const id = $item.attr( 'data-id' )

      loadPageStyles( id )

      const components = Components( $, ich, persistence, { page: id } )

      $item.wrapInner( '<div class="user-settings-row"></div>' )

      const $row = $item.find( '.user-settings-row' )

      $row.append( '<span class="component-select-action"> <a href="#">Select Editable Components</a></span>' )

      const $action = $row.find( '.component-select-action a' )

      $action.on( 'click', e => {
        e.preventDefault()

        let $componentsInput = $( 'input[name="pageClaims.components"]' )
        let json = $componentsInput.val()
        let pageComponents = JSON.parse( json )
        let selected = ( id in pageComponents ) ? pageComponents[ id ] : []

        persistence.load( id, ( err, page ) => {
          if( err ) throw err

          persistence.load( page.document, ( err, document ) => {
            if( err ) throw err

            dialogs.getValue( 'pageAccess', { components, root: document, title: page.title, selected }, selected => {
              if( !selected ){
                return
              }

              pageComponents[ id ] = selected

              json = JSON.stringify( pageComponents )

              $componentsInput.val( json )
            })
          })
        })
      })
    })
  }

  events.on( 'listbuilderbuilt', e => {
    decorate()
  })
})
