'use strict'

const Drake = deps => {
  const cloneSelector = '[data-toolbar] [data-dragsource="composer"]' 
  const containerSelector = '[data-dragsource="composer"]'
  const { updateNode, dragula, find, ondrop } = deps

  const isContainer = el => el.matches( containerSelector )

  const accepts = ( el, containerEl ) => {
    let accepts = containerEl.matches( containerSelector )

    if( accepts ){
      accepts = !containerEl.matches( cloneSelector )
    }

    if( accepts ){
      const node = find.elNode( el )
      const parentNode = find.containerElNode( containerEl )

      if( node === parentNode ) return false

      accepts = parentNode.accepts( node )
    }

    return accepts
  }

  const options = { isContainer, accepts }

  const drake = dragula( options )

  drake.on( 'drop', ( el, containerEl, sourceContainerEl, nextEl ) => {
    const node = find.elNode( el )
    const parentNode = find.containerElNode( containerEl )
    
    if( nextEl ){
      const referenceNode = find.elNode( nextEl )
      parentNode.insertBefore( node, referenceNode )
    } else {
      parentNode.append( node )
    }

    updateNode( node )    
    
    ondrop( node, parentNode, el, containerEl, sourceContainerEl, nextEl )    
  })

  return drake
}

module.exports = Drake
