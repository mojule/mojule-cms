'use strict'

const url = require( 'url' )
const path = require( 'path' )
const User = require( '../user' )
const claims = require( '../claims' )
const UserModel = require( '../view-models/user-model' )
const Reference = require( '../form-models/reference' )
const utils = require( '../utils/utils' )
const DbItem = require( '../db/db-item' )
const Configurator = require( '../configurator' )

const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )

const init = store => {
  const saveMasterUsers = masterUsers => Promise.all(
    masterUsers.map(
      user => store.saveP( user )
    )
  )

  const createMasterUsers = () => {
    const masterUsers = [
      configurator.masterUser()
    ].map( masterUser => {
      const master = User( masterUser.email, masterUser.password )

      master.claims = claims.master.slice()

      return master
    })

    return saveMasterUsers( masterUsers )
  }

  const checkExistingUsers = users => {
    //if there are already users then we have already called init
    if ( users.length > 0 ) {
      return Promise.resolve( users )
    } else {
      return createMasterUsers()
    }
  }

  return store.getP( 'user' )
    .then( checkExistingUsers )
}

const emailNewUser = ( emailer, user, password, siteName, siteUrl, loginUrl ) =>
  new Promise(
    ( resolve, reject ) => {
      /*
        Generated password - we don't have change password set up just yet so we've changed the message below but this was it

        text: 'A new account has been created for you on ' + siteName + ' - your temporary password is:\n' + password + '\nPlease login at ' + siteUrl + ' and choose a new password.'
      */

      const urlData = url.parse( siteUrl )
      const fromAddress = 'noreply@' + urlData.hostname

      let text = 'A new account has been created for you on ' + siteName + ' - your password is:\n' + password

      if ( typeof loginUrl === 'string' ) {
        text += '\n\nYou can login at ' + loginUrl
      }

      const email = new emailer.Email( {
        to: user.email,
        from: fromAddress,
        subject: 'New User Account on ' + siteName,
        text
      })

      emailer.send( email, ( err, json ) => {
        if ( err ) {
          reject( err )
        } else {
          resolve({
            valid: true,
            data: user
          })
        }
      })
    }
  )

const createSiteUser = ( api, store, emailer, creator, body, customClaims, site, extraProperties, loginUrl ) => {
  const claims = customClaims.map( claim => {
    return {
      name: claim,
      _id: utils.toIdentifier( claim )
    }
  })

  const siteReferences = [Reference( site )]

  const schemaData = {
    claims: {
      items: {
        enum: claims
      }
    },
    sites: {
      items: {
        enum: siteReferences
      }
    }
  }

  const userModel = UserModel( schemaData )

  const newUser = userModel.assemble( body )

  const validation = userModel.validate( newUser )

  if ( validation.errors.length > 0 ) {
    return Promise.resolve({
      valid: false,
      data: userModel.form( {}, newUser, validation.errors )
    })
  } else {
    const password = utils.randomHex( 10 )

    const user = Object.assign(
      {},
      extraProperties,
      User( newUser.email, password )
    )

    //assigning like this has the useful side effect of overwriting any extraProperties that may clash
    user.creator = creator._id
    user.name = newUser.name
    user.claims = newUser.claims
    user.sites = newUser.sites
    user.currentSite = site._id
    user.isSiteUser = true

    return store.saveP( user )
      .then( user => {
        return emailNewUser( emailer, user, password, site.name, site.urls[0], loginUrl )
      })
  }
}

const create = ( api, store, emailer, creator, body, customClaims, site, extraProperties, loginUrl ) => {
  if ( Array.isArray( customClaims ) ) {
    if ( !site ) {
      return Promise.reject( Error( 'Site User requires a site' ) )
    }

    return createSiteUser( api, store, emailer, creator, body, customClaims, site, extraProperties, loginUrl )
  }

  let sites

  return api.getSites( creator )
    .then( creatorSites => {
      sites = creatorSites
    })
    .then( () => {
      const editorClaims = claims.getClaims( creator ).map( claim => {
        return {
          name: claim.label,
          _id: claim.key
        }
      })

      const siteReferences = sites.map( Reference )

      const schemaData = {
        claims: {
          items: {
            enum: editorClaims
          }
        },
        sites: {
          items: {
            enum: siteReferences
          }
        }
      }

      const userModel = UserModel( schemaData )

      const newUser = userModel.assemble( body )

      const validation = userModel.validate( newUser )

      if ( validation.errors.length > 0 ) {
        return Promise.resolve( {
          valid: false,
          data: userModel.form( {}, newUser, validation.errors )
        })
      } else {
        const password = utils.randomHex( 10 )
        const user = User( newUser.email, password )

        user.creator = creator._id
        user.name = newUser.name

        const newClaims = newUser.claims.map( c => c._id )
        const newSites = newUser.sites

        creator.claims.forEach( claim => {
          if ( newClaims.includes( claim ) ) {
            user.claims.push( claim )
          }
        })

        sites.forEach( site => {
          if ( newSites.some( s => s._id === site._id ) ) {
            const siteReference = Reference( site )
            user.sites.push( siteReference )
          }
        })

        user.currentSite = user.sites[0]._id

        return store.saveP( user )
          .then( user => {
            const site = sites.find( s => s._id === user.currentSite )

            return emailNewUser( emailer, user, password, site.name, site.urls[0] )
          })
      }
    })
}

const editSiteUser = ( api, store, editor, user, body, customClaims, site ) => {
  const claims = customClaims.map( claim => {
    return {
      name: claim,
      _id: utils.toIdentifier( claim )
    }
  })

  const siteReferences = [Reference( site )]

  const schemaData = {
    claims: {
      items: {
        enum: claims
      }
    },
    sites: {
      items: {
        enum: siteReferences
      }
    }
  }

  const userModel = UserModel( schemaData )

  const newUser = userModel.assemble( body )

  const validation = userModel.validate( newUser )

  if ( validation.errors.length > 0 ) {
    const formOptions = {
      action: '/cms/siteusers/' + user._id
    }

    return Promise.resolve( {
      valid: false,
      data: userModel.form( formOptions, newUser, validation.errors )
    })
  } else {
    user.name = newUser.name
    user.email = newUser.email
    user.claims = newUser.claims
    user.sites = newUser.sites
    user.isSiteUser = true

    return store.saveP( user )
      .then( user => Promise.resolve({
        valid: true,
        data: user
      }))
  }
}

const edit = ( api, store, editor, user, body, customClaims, site ) => {
  if ( Array.isArray( customClaims ) ) {
    if ( !site ) {
      return Promise.reject( Error( 'Site User requires a site' ) )
    }

    return editSiteUser( api, store, editor, user, body, customClaims, site )
  }

  return api.getSites( editor )
    .then( sites => {
      const editorClaims = claims.getClaims( editor ).map( claim => {
        return {
          name: claim.label,
          _id: claim.key
        }
      })

      const siteReferences = sites.map( Reference )

      const schemaData = {
        claims: {
          items: {
            enum: editorClaims
          }
        },
        sites: {
          items: {
            enum: siteReferences
          }
        }
      }

      const userModel = UserModel( schemaData )

      const newUser = userModel.assemble( body )

      const validation = userModel.validate( newUser )

      if ( validation.errors.length > 0 ) {
        const formOptions = {
          action: '/cms/users/' + user._id
        }

        return Promise.resolve( {
          valid: false,
          data: userModel.form( formOptions, newUser, validation.errors )
        })
      } else {
        user.name = newUser.name
        user.email = newUser.email

        const newClaims = newUser.claims.map( c => c._id )
        const newSites = newUser.sites

        //only allow editing of claims and sites if the editor is a master user or if the editor is not the person being edited
        if ( editor.claims.includes( 'master' ) || editor._id !== user._id ) {
          user.claims = newClaims
          user.sites = newSites
        }

        return store.saveP( user )
          .then( user => Promise.resolve({
            valid: true,
            data: user
          }))
      }
    })
}

const getSites = ( store, user ) =>
  user.claims.includes( 'master' ) ?
    store.getP( 'site' ) :
    store.loadP( user.sites.map( s => s._id ) )

const resetPassword = ( store, emailer, email, siteUrl, siteId ) =>
  store.getP( 'user' )
    .then( users => users.find( user => user.email === email ))
    .then( user => store.saveP({
      key: 'token',
      created: ( new Date() ).toJSON(),
      user: user._id,
      email: user.email
    }))
    .then( token => {
      const urlData = url.parse( siteUrl )
      let fromAddress = 'noreply@mojule.nz'

      let urlPath = '/cms/changepassword/'

      if ( typeof siteId === 'string' ) {
        urlPath += siteId
        fromAddress = 'noreply@' + urlData.hostname
      }

      const query = { token: token._id }

      const changeUrl = url.format( {
        protocol: urlData.protocol,
        host: urlData.host,
        pathname: urlPath,
        query
      })

      return new emailer.Email( {
        to: token.email,
        from: fromAddress,
        subject: 'Reset Password Link',
        text: 'Please follow this link to reset your password:\n' + changeUrl
      })
    })
    .then( email => new Promise(
      ( resolve, reject ) => {
        emailer.send( email, err => {
          if ( err ) {
            reject( err )
          } else {
            resolve()
          }
        })
      }
    ))

const changePassword = ( store, tokenId, newPassword, user ) => {
  if ( user ) {
    return Promise.resolve( user )
      .then( user => {
        if ( user === null ) {
          throw new Error( 'Invalid, missing or expired token' )
        } else {
          const newUser = User( user.email, newPassword )

          user.password = newUser.password
          user.salt = newUser.salt

          return store.saveP( user )
        }
      })
  }

  let currentUser

  return store.loadP( tokenId )
    .then( token => {
      if ( token === null ) {
        throw new Error( 'Invalid, missing or expired token' )
      } else {
        return store.loadP( token.user )
      }
    })
    .then( user => {
      if ( user === null ) {
        throw new Error( 'Invalid, missing or expired token' )
      } else {
        const newUser = User( user.email, newPassword )

        user.password = newUser.password
        user.salt = newUser.salt

        return store.saveP( user )
      }
    })
    .then( user => {
      currentUser = user

      return store.getP( 'token' )
    })
    .then( tokens => {
      const remove = tokens.filter( token => {
        if ( token.user === currentUser._id ) return true

        const now = new Date()
        const then = new Date( token.created )

        then.setDate( then.getDate() + 1 )

        return now > then
      }).map( token => store.removeP( token._id ))

      return Promise.all( remove )
    })
}

const settings = ( api, store, user ) => {
  return Promise.resolve( utils.isDbIdentifier( user.settings ) )
    .then( hasSettings => {
      if ( hasSettings ) {
        return store.loadP( user.settings )
      } else {
        const settings = DbItem( {
          user: user._id,
          site: {}
        }, 'settings' )

        user.settings = settings._id

        return store.saveP( user )
          .then(() => store.saveP( settings ) )
      }
    })
}

const siteToCmsUser = ( api, cmsStore, siteStore, editor, user ) => {
  delete user.isSiteUser

  user.claims = []
  user.creator = editor._id

  return siteStore.removeP( user._id )
    .then(
      () => cmsStore.saveP( user )
    )
}

/**
 * User API Object Factory
 * @param {object} store - An instance of a db store
 * @param {object} emailer - An instance of an email sender
 * @return {object}
 */
const UserApi = ( store, emailer ) => {
  const api = {
    init: () => init( store ),

    //look at this fucking hot mess:
    create: ( creator, body, customClaims, site, extraProperties, loginUrl ) => create( api, store, emailer, creator, body, customClaims, site, extraProperties, loginUrl ),

    edit: ( editor, user, body, customClaims, site ) => edit( api, store, editor, user, body, customClaims, site ),

    getSites: user => getSites( store, user ),

    verify: ( user, password ) => Promise.resolve( User.verify( user, password ) ),

    resetPassword: ( email, siteUrl, siteId ) => resetPassword( store, emailer, email, siteUrl, siteId ),

    changePassword: ( tokenId, newPassword, user ) => changePassword( store, tokenId, newPassword, user ),

    settings: user => settings( api, store, user ),

    siteToCmsUser: ( cmsStore, siteStore, editor, user  ) => siteToCmsUser( api, cmsStore, siteStore, editor, user )
  }

  return api
}

module.exports = UserApi
