'use strict'

const Mtree = require( '../mtree' )

const empty = require( './plugins/empty' )

const id = require( '../plugins/id' )
const meta = require( '../plugins/meta' )
const accepts = require( '../plugins/accepts' )
const render = require( '../plugins/render' )

const ComposerTree = Mtree( id, meta, empty, accepts, render )

module.exports = ComposerTree
