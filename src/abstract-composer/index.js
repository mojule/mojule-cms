'use strict'

const dragula = require( 'dragula' )
const morphdom = require( 'morphdom' )
const Composer = require( './composer' )
const Toolbars = require( './toolbars')

const abstractComposer = () => {
  const abstractComposerEl = document.getElementById( 'abstractComposer' )

  if( !abstractComposerEl ) return

  const getFileTree = () => {
    const fsData = require( './data/fs-data' )
    const Ftree = require( './file-tree' )
    const tree = Ftree( fsData )

    return tree
  }

/*
  const getTree = () => {
    const data = require( './data' )

    const Ctree = require( './composer-tree' )
    const tree = Ctree( data )

    return tree
  }
*/

  const tree = getFileTree()
  //const tree = getTree()

  const deps = { dragula, morphdom, document }

  const options = { selector: '#abstractComposer' }

  const state = { tree, options }

  const composer = Composer( deps, state )

  const htmlToolbars = () => {
    const toolbarOptions = {
      composer
    }

    const toolbars = Toolbars( toolbarOptions )
    const toolbarContainerEl = document.getElementById( 'toolbars' )
    const toolTree = toolbars.tree()

    toolbarContainerEl.innerHTML = toolTree.render()
  }

  //htmlToolbars()
}

module.exports = abstractComposer
