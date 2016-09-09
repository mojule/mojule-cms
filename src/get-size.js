'use strict'

const fs = require( 'fs' )
const pify = require( 'pify' )
const dependencies = require( '../dependencies' )

const getImageSize = dependencies.getImageSize
const readFile = pify( fs.readFile )

const getSize = filePath =>
  readFile( filePath )
    .then(
      getImageSize
    )

module.exports = getSize
