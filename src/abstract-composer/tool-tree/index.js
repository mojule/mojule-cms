'use strict'

const Mtree = require( '../mtree' )

const empty = require( './plugins/empty' )
const render = require( './plugins/render' )
const createTool = require( './plugins/createTool' )

const id = require( '../plugins/id' )
const meta = require( '../plugins/meta' )
const accepts = require( '../plugins/accepts' )

const ToolTree = Mtree( id, meta, empty, accepts, render, createTool )

module.exports = ToolTree
