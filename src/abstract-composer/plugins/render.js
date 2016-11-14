'use strict'

const RenderPlugin = require( './renderFactory' )
const RenderViews = require( './renderViews' )

const views = RenderViews( { treeType: 'composer' } )

module.exports = RenderPlugin( views )
