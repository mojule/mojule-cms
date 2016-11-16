'use strict'

const Find = idMap => {
  const nodeEl = el => el.querySelector( '[data-node]' )
  const containerEl = el => el.closest( '[data-node]' )
  const elNode = el => idMap.findById( nodeEl( el ).id )
  const containerElNode = el => idMap.findById( containerEl( el ).id )

  return { nodeEl, containerEl, elNode, containerElNode }
}

module.exports = Find
