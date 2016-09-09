'use strict'

const fs = require( 'fs' )
const pify = require( 'pify' )
const dependencies = require( '../dependencies' )

const readFile = pify( fs.readFile )
const imageResizer = dependencies.imageResizer

const Job = ( image, mimetype, width, height ) => {
  return {
    image,
    mimetype,
    width,
    height
  }
}

const resizer = ( filepath, mimetype, width, height ) => {
  return readFile( filepath )
    .then(
      bytes => {
        return Job( bytes, mimetype, width, height )
      }
    )
    .then(
      job => {
        return imageResizer( job )
      }
    )
}

module.exports = resizer
