'use strict'

const bcrypt = require( 'bcryptjs' )
const DbItem = require( './db/db-item' )

const User = ( email, password ) => {
  const salt = bcrypt.genSaltSync( 10 )
  
  const user = {
    email,
    salt,
    password: bcrypt.hashSync( password, salt ),
    sites: [],
    claims: []
  }

  return DbItem( user, 'user' )
}

User.verify = ( user, password ) =>
  bcrypt.compareSync( password, user.password )

module.exports = User
