'use strict'

const Jimp = require( 'jimp' )

const imageResizer = job =>
  Jimp.read( job.image )
    .then( image => image.resize( job.width, job.height ) )
    .then( image =>
      new Promise( ( resolve, reject ) => {
        if( job.mimetype === 'image/jpeg' ){
          image.quality( 90 )
        }

        image.getBuffer( job.mimetype, ( err, buffer ) => {
          if( err ){
            reject( err )
            return
          }

          resolve( buffer )
        })
      })
    )

module.exports = imageResizer
