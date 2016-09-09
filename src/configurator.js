'use strict'
/**
 * @module configurator
 * Exports configuration info in js objects.  e.g. environment, sendgrid etc
 * Config settings priority from lowest to highest is: defaults, configFile, environment, args
 * Node environment and args settings use composite keys in form:
 *  "recaptcha_sitekey" : "sitekey from env"
 *  --sendgrid_apikey=This came from args"
 * IMPORTANT - nconf seems to remember state.
 * It is not possible to test this code as nconf can only be configured once per mocha run.
 */
const path = require( 'path' )
const fs = require( 'fs' )
const nconf = require( 'nconf' )

/**
 * Sync call - start up only
 */
const isFileExist = ( fileName ) => {
  try {
    const stats = fs.statSync( fileName )
    return stats.isFile()
  } catch ( e ) {
    if ( e.code == 'ENOENT' ) return false
    throw e
  }
}

/**
 * @Api
 * @param configFile - name of config file.  May be undefined
 */
const Api = ( configFile ) => {
  const isConfigFile = configFile != null && isFileExist( configFile )

  const nodeEnv = 'NODE_ENV'
  const sendGrid = 'sendgrid'
  const reCatpcha = 'recaptcha'
  const azure = 'azure'
  const imageResize = 'imageResize'
  const smtp = 'smtp'
  const masterUser = 'masterUser'

  const sgApiKey = 'apikey'
  const rcSiteKey = 'sitekey'
  const rcSecretKey = 'secretkey'
  const azAppInsightsKey = 'appinsightskey'
  const irPresizeKey = 'presize'

  const smHost = 'host'
  const smPort = 'port'
  const smSecure = 'secure'
  const smUser = 'user'
  const smPass = 'pass'

  const muEmail = 'email'
  const muPass = 'password'

  // Order important - Priority highest to  lowest: args, env, configFile, default
  nconf.argv().env()
  if ( isConfigFile ) {
    nconf.file( configFile )
  }

  // Normalizes both objects in config files and composite keys
  const getConfigObject = ( objectName, propertyNames ) => {
    //this will be undefined if not in configFile
    const resultObject = nconf.get( objectName )

    //no property names were specified
    if( !Array.isArray( propertyNames ) || propertyNames.length === 0 ) return resultObject

    //create a new object using composite keys from env or args
    const compositeKeysObject = propertyNames.reduce( ( compositeObject, propertyName ) => {
      const value = nconf.get( `${objectName}_${propertyName}` )

      if( value ){
        compositeObject[ propertyName ] = value
      }

      return compositeObject
    }, {} )

    //there were no composite keys - this will return undefined if there is also no configFile object
    if( Object.keys( compositeKeysObject ).length === 0 ) return resultObject

    //existed in both configFile and env or args, extend the configFile obj with the composite keys
    if( resultObject && compositeKeysObject ){
      return Object.assign( resultObject, compositeKeysObject )
    }

    //there was no object from configFile, but there was a compositeKeysObject
    return compositeKeysObject
  }

  const api = {
    nodeenv: () => nconf.get( nodeEnv ),
    azure: () => getConfigObject( azure, [ azAppInsightsKey ] ),
    sendgrid: () => getConfigObject( sendGrid, [ sgApiKey ] ),
    recaptcha: () => getConfigObject( reCatpcha, [ rcSiteKey, rcSecretKey ] ),
    imageResize: () => getConfigObject( imageResize, [ irPresizeKey ] ),
    smtp: () => getConfigObject( smtp, [ smHost, smPort, smSecure, smUser, smPass ] ),
    masterUser: () => getConfigObject( masterUser, [ muEmail, muPass ] )
  }

  return api
}

module.exports = Api
