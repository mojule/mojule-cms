'use strict'

const Jimp = require( 'jimp' )

const getSize = buffer =>
  Jimp.read( buffer )
    .then( image => {
      return {
        width: image.bitmap.width,
        height: image.bitmap.height
      }
    })

module.exports = getSize
