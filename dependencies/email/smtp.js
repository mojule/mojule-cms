'use strict'

const path = require( 'path' )
const nodemailer = require( 'nodemailer' )
const Configurator = require( '../../src/configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const smtpConfig = configurator.smtp()

const transportOptions = {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass
  }
}

const transporter = nodemailer.createTransport( transportOptions )

const emailer = {
  Email: function( email ){
    Object.assign( this, email )
  },
  send: ( email, callback ) => {
    transporter.sendMail( email, ( err, response ) => {
      callback( err, response )
    })
  }
}

module.exports = emailer
