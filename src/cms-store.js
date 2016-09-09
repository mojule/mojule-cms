'use strict'
/**
 * @module
 */
const emailer = require( './email' )
const initDirs = require( './init-dirs' )
const Store = require( './db-store' )

const init = store => {
  const userApi = require( './api/user-api' )( store, emailer )

  return userApi.init()
    .then(
      () => initDirs()
    )
    .then(
      () => Promise.resolve( store )
    )
}

const cmsStore = {
  init: () => {
    cmsStore.store = Store( 'cms' )

    return init( cmsStore.store )
  }
}

module.exports = cmsStore
