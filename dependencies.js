'use strict'

const Store = require( './dependencies/store/leveldb-store' )

const emailer = require( './dependencies/email/sendgrid' )
const imageResizer = require( './dependencies/images/jimp-resizer' )
const getImageSize = require( './dependencies/images/jimp-getsize' )

const dependencies = {
  Store, emailer, imageResizer, getImageSize
}

module.exports = dependencies
