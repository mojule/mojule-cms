'use strict'
/**
 * @module site-api.js - Supports cms site operations. i.e. The cms handles multiple sites.
 * - The site-api operates on the store holding the site metadata.
 */

const path = require( 'path' )
const fs = require( 'fs' )
const url = require( 'url' )

const pify = require( 'pify' )

const utils = require( '../utils/utils' )
const DbItem = require( '../db/db-item' )
const SiteModel = require( '../view-models/site-model' )
const Reference = require( '../form-models/reference' )
const zipper = require( '../zipper')
const FileApi = require( './file-api' )
const sitemapFromUrls = require( '../sitemap' )

const siteModel = SiteModel()

const fileExists = filePath => new Promise(
  resolve => {
    fs.exists( filePath, exists => resolve( exists ) )
  }
)

const readdir = pify( fs.readdir )
const stat = pify( fs.stat )
const unlink = pify( fs.unlink )

const onSave = ( api, stores, site, item, callback ) => {
  api.purgeHtmlCache( stores, site )
    .then(
      () => callback()
    )
    .catch(
      err => callback( err )
    )
}

const create = ( store, Store, session, user, body ) => {
  const site = DbItem( siteModel.assemble( body ), 'site' )

  const validate = siteModel.validate( site )

  if( validate.errors.length > 0 ){
    const formOptions = {
      submitLabel: 'Create Site'
    }

    const form = siteModel.form( formOptions, site, validate.errors )

    return Promise.resolve({
      valid: false,
      data: form
    })
  }

  site.creator = user._id

  site.db = site._id

  const siteStore = Store( site.db )

  const pageApi = require( './page-api' )( site, siteStore, session )
  const templateApi = require( './template-api' )( site, siteStore, session )

  return templateApi.defaultMaster( user )
    .then(
      template => {
        site.master = template._id

        const homePage = {
          'name': 'Home'
        }

        return homePage
      }
    )
    .then(
      homePage => pageApi.newPage( homePage, user )
    )
    .then(
      page => {
        site.homePage = page._id

        return site
      }
    )
    .then(
      site => store.saveP( site )
    )
    .then(
      site => {
        const siteReference = Reference( site )

        user.sites.push( siteReference )
        user.currentSite = site._id

        return user
      }
    )
    .then(
      user => store.saveP( user )
    )
    .then(
      () => Promise.resolve({
        valid: true,
        data: site
      })
    )
}

const edit = ( api, store, stores, site, body ) =>
  api.getStore( stores, site )
    .then(
      siteStore => siteStore.getP( 'file' )
    )
    .then(
      files => {
        const stylesheets = files.filter(
          f =>
            f.mimetype === 'text/css'
        )

        const stylesheetRefs = stylesheets.map( s => {
          return {
            _id: s._id,
            name: s.originalname
          }
        })

        const dynamicSchema = {
          stylesheets: {
            items: {
              enum: stylesheetRefs
            }
          }
        }

        const siteModel = SiteModel( dynamicSchema )

        const newSite = siteModel.assemble( body )

        const validate = siteModel.validate( newSite )

        const formOptions = {
          action: '/cms/sites/' + site._id
        }

        if( validate.errors.length > 0 ){
          const form = siteModel.form( formOptions, newSite, validate.errors )

          return {
            valid: false,
            data: form
          }
        } else {
          site.name = newSite.name
          site.urls = newSite.urls
          site.stylesheets = newSite.stylesheets
          site.claims = newSite.claims

          return store.saveP( site )
            .then(
              site => Promise.resolve({
                valid: true,
                data: site
              })
            )
        }
      }
    )
/**
 * @function
 * @name getStore
 * @param api - instance of this site-api
 * @param Store - Store object factory
 * @param stores - Object mapping store names to store instances
 * @param site - instance of cms site
 * @returns - reolved promise store instance.  Note that if the site store is not present in stores then it created, added to stores and returned.
 */
const getStore = ( api, Store, stores, site ) => {
  if( !stores[ site.db ] ){
    stores[ site.db ] = Store( site.db, [ 'mimetype' ], item => {
      onSave( api, stores, site, item, err => {
        if( err ){
          throw err
        }
      })
    })
  }

  return Promise.resolve( stores[ site.db ] )
}

/**
 * @function filePaths
 * @return  - a list of disk paths referencing all the user uploaded files associated with the site. (Regardless of type)
 * @param api - site api instance.
 * @param stores - bject mapping store names to store instances.
 * @param site - site instance
 */
const filePaths = ( api, stores, site ) => {
  let fileApi


  return api.getStore( stores, site )
    .then(
      store => {
        fileApi = FileApi( store, site )

        return store
      }
    )
    .then(
      store => store.getP( 'file' )
    )
    .then(
      files => Promise.all(
        files.map(
          file => path.relative( process.cwd(), fileApi.getPath( file ) )
        )
      )
    )
}

const siteData = ( api, stores, site ) =>
  api.getStore( stores, site )
    .then(
      store => store.allP()
    )
    .then(
      all => Promise.resolve( Object.assign({}, site, {items:all}) )
    )

const backup = ( api, stores, site ) => {
  const addSiteData = zip =>
    api.siteData( stores, site )
      .then(
        siteData => zipper.addObject( zip, siteData, 'site.json' )
      )

  const addFiles = zip =>
    api.filePaths( stores, site )
      .then(
        files => zipper.addFiles( zip, files )
      )

  return zipper.create()
    .then(
      addSiteData
    )
    .then(
      addFiles
    )
    .then(
      zipper.close
    )
}

/**
 * @function getsite
 * @return - the site corresponding to the passed url.
 * - i.e. The cms handles multiple sites.  Prior to the creation of a session for the user the
 * - url in the http request header is the only way to determine what the user referenced.
 * - ToDo: Move this to the cms-api as it is not specific to the site.
 * @param store - cms store instance
 * @param user - user instance
 * @param currentUrl - site url from http request header
 */
const getSite = ( store, logger, user, currentUrl ) => {
  const parsed = url.parse( currentUrl )
  const hostname = parsed.hostname

  return store.getP( 'site' )
    .then(
      sites => {
        const site = sites.find(
          site => {
            const urls = site.urls.map( siteUrl => {
              const parsed = url.parse( siteUrl )
              const hostname = parsed.hostname

              return hostname
            })

            return urls.includes( hostname )
          }
        )

        if( site ){
          logger.info( { message: { hostname, site } }, 'siteApi.getSite matched URL' )
          return Promise.resolve( site )
        } else if( user && user.currentSite ) {
          return store.loadP( user.currentSite )
            .then(
              site => {
                logger.info( { message: { hostname, site } }, 'siteApi.getSite user.currentSite' )

                return site
              }
            )
        } else if( sites.length > 0 ) {
          logger.info( { message: { hostname, site: sites[ 0 ] } }, 'siteApi.getSite defaulting to first site' )

          return Promise.resolve( sites[ 0 ] )
        } else {
          return Promise.reject( new Error( 'No site found for ' + hostname ) )
        }
      }
    )
}

/**
 * @function getStyles
 * @return  - a list of urls referencing all the user uploaded stylesheets associated with the site.
 * @param api - site api instance.
 * @param stores - bject mapping store names to store instances.
 * @param site - site instance
 */
const getStyles = ( api, stores, site ) => {
  if( !site.stylesheets || site.stylesheets.length === 0 ){
    return Promise.resolve( [] )
  }

  return api.getStore( stores, site )
    .then(
      siteStore => {
        const fileApi =  require( './file-api' )( siteStore )

        return api.getStyleFiles( stores, site )
          .then(
            files => Promise.all( files.map( fileApi.getUrl ) )
          )
      }
    )
}

const getStyleFiles = ( api, stores, site ) => {
  if( !site.stylesheets || site.stylesheets.length === 0 ){
    return Promise.resolve( [] )
  }

  return api.getStore( stores, site )
    .then(
      siteStore => {
        return Promise.all(
          site.stylesheets.map(
            sheet => {
              let id

              //backwards compatibility for old site format
              if( typeof sheet === 'string' ){
                id = sheet
              } else {
                id = sheet._id
              }

              return siteStore.loadP( id )
            }
          )
        )
      }
    )
}

/**
 * @function purgeHtmlCache
 * @returns - purge promise or empty promise
 * @param api - instance of this site-api
 * @param stores - Object mapping store names to store instances
 * @param site - instance of cms site
 */
const purgeHtmlCache = ( api, stores, logger, site ) => {
  const cachePath = path.join( 'cache', site._id )

  logger.info( 'Saved to db, purging HTML cache' )

  const purgeIfFile = filepath =>
    stat( filepath )
      .then(
        stats => {
          if( stats.isFile() ){
            return unlink( filepath )
          } else {
            return Promise.resolve()
          }
        }
      )

  const purge = () =>
    readdir( cachePath )
      .then(
        files => Promise.all(
          files.map(
            filename => path.join( cachePath, filename )
          )
        )
      )
      .then(
        filepaths => Promise.all(
          filepaths.map( purgeIfFile )
        )
      )

  return fileExists( cachePath )
    .then(
      exists => {
        if( exists ){
          return purge()
        } else {
          return Promise.resolve()
        }
      }
    )
}

const sitemap = ( api, Store, session, stores, site ) => {
  let store
  let pages
  let pageApi
  let urls

  return api.getStore( stores, site )
    .then( result => {
      store = result
    })
    .then( () =>
      require( './page-api' )( site, store, session )
    )
    .then( result => {
      pageApi = result
    })
    .then( () =>
      store.getP( 'page' )
    )
    .then( pages => {
      return Promise.all( pages.filter( page => {
        const pageHasClaims = Array.isArray( page.requireClaims ) && page.requireClaims.length > 0
        return !pageHasClaims
      }).map( pageApi.getRoute ))
    })
    .then( routes => {
      const urlData = url.parse( site.urls[ 0 ] )

      return routes.map( route => url.format({
        protocol: urlData.protocol,
        hostname: urlData.hostname,
        pathname: route
      }))
    })
    .then( urls => {
      return sitemapFromUrls( urls )
    })
}

/**
 * @function Api
 * @param Store - Store object factory
 * @param deps - dependencies like the logger, stores
 * @param session - session state object
 * @returns - instance of the Site API
 */
const Api = ( Store, deps, session ) => {
  const store = deps.stores.cms

  const logger = deps.logger.child( '/src/api/site-api' )

  const api = {
    create: ( user, body ) => create( store, Store, session, user, body ),
    edit: ( stores, site, body ) => edit( api, store, stores, site, body ),
    getStore: ( stores, site ) => getStore( api, Store, stores, site ),
    siteData: ( stores, site ) => siteData( api, stores, site ),
    backup: ( stores, site ) => backup( api, stores, site ),
    getSite: ( user, currentUrl ) => getSite( store, logger, user, currentUrl ),
    getStyles: ( stores, site ) => getStyles( api, stores, site ),
    getStyleFiles: ( stores, site ) => getStyleFiles( api, stores, site ),
    purgeHtmlCache: ( stores, site ) => purgeHtmlCache( api, stores, logger, site ),
    filePaths: ( stores, site ) => filePaths( api, stores, site ),
    sitemap: ( stores, site ) => sitemap( api, Store, session, stores, site )
  }

  return api
}

module.exports = Api
