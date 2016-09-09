'use strict'

const async = require( 'async' )
const claims = require( '../src/claims' )
const ComposerModel = require( '../models/composer-model' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const utils = require( '../src/utils/utils' )
const path = require( 'path' )
const templateNames = require( '../src/template-names' )
const SiteApi = require( '../src/api/site-api' )
const PageApi = require( '../src/api/page-api' )
const UserApi = require( '../src/api/user-api' )
const emailer = require( '../src/email' )

const toolbarComponents = [
  'heading', 'paragraph', 'ul', 'ol', 'image', 'imageText', 'box', 'columns', 'grid',
  'carousel', 'tabs', 'html', 'block', 'formInstance'
]

const prefabComponents = [
  'navigation', 'subnavigation',
  'sitemap', 'userActions'
]

const formToolbarComponents = [
  'formText', 'formMultiline', 'formEmail', 'formCheckbox', 'formDropdown'
]

const composerTemplates = templateNames.common.concat( templateNames.composer )

const pagesToPageItems = pages =>
  pages
    .sort( p => new Date( p._created ) )
    .map( p => {
      return {
        url: '/cms/composer/' + p._id,
        title: p.name,
        requireClaims: ['editPage'],
        icon: 'magic'
      }
    })

const composerListModel = ( user, site, items ) => Object.assign(
  {
    title: 'mojule',
    icon: 'magic',
    subtitle: 'Composer',
    user: {
      email: user.email,
      id: user._id
    },
    library: {
      size: 4,
      items: items
    }
  },
  new UiModel( site )
)

const composerModel = ( user, options, styleUrls, templatesDictionary ) => Object.assign(
  {
    title: 'mojule',
    icon: 'magic',
    toolbars: true,
    user: {
      email: user.email,
      id: user._id
    }
  },
  new ComposerModel( options, styleUrls ),
  {
    templates: composerTemplates.map( key => {
      return {
        key,
        template: templatesDictionary[key].template
      }
    })
  }
)

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  const userApi = UserApi( app.deps.stores.cms, emailer )

  const getSiteSettings = ( user, siteId ) => {
    return userApi.settings( user )
      .then( settings => {
        return settings.site[ siteId ]
      })
  }

  const index = ( req, res ) => {
    const siteApi = SiteApi( DbStore, app.deps, req.session )

    let siteSettings

    getSiteSettings( req.user, req.session.currentSite._id )
      .then( settings => {
        siteSettings = settings || {}
      })
      .then( () => siteApi.getStore( app.deps.stores, req.session.currentSite ) )
      .then( store => store.getP( 'page' ) )
      .then( pages => {
        if( siteSettings.restrict ){
          pages = pages.filter( p => ( p._id in siteSettings.pages ) )
        }

        const items = claims.filterByClaims( pagesToPageItems( pages ), req.user.claims )
        const model = composerListModel( req.user, req.session.currentSite, items )

        res.render( 'ui-home', model )
      })
      .catch( err => {
        logger.error( err )
        const status = utils.httpStatus._500InternalServerError
        res.status( status.code )
        res.render( 'error', { status: status, message: err.message })
      })
  }

  const getOptions = {
    page: page => {
      return {
        id: page.document,
        type: 'document',
        page: page._id,
        toolbarComponents: toolbarComponents
      }
    },
    template: template => {
      return {
        id: template._id,
        type: 'template',
        toolbarComponents: toolbarComponents.concat( prefabComponents )
      }
    },
    form: form => {
      return {
        id: form._id,
        type: 'form',
        toolbarComponents: formToolbarComponents
      }
    }
  }

  const optionsFromRoot = ( root, site ) => {
    if ( !( root.key in getOptions ) ) {
      return
    }

    const options = Object.assign(
      { site },
      getOptions[root.key]( root )
    )

    return options
  }

  const composer = ( req, res ) => {
    const tryGetPageStyles = ( pageId, site, store ) => {
      if ( pageId ) {
        const pageApi = PageApi( site, store, req.session )

        return store.loadP( pageId ).then( pageApi.getStyles )
      } else {
        return Promise.resolve( [] )
      }
    }

    const siteApi = SiteApi( DbStore, app.deps, req.session )
    const id = req.params.id

    if ( !utils.isDbIdentifier( id ) ) {
      const status = utils.httpStatus.h400BadRequest
      logger.warn( status.message + ': ' + req.url )
      res.render( 'error', { status: status, message: err.message })
      return
    }

    const templatesDictionary = app[ 'template-engine' ].templates.dictionary

    let siteStyles
    let options
    let siteStore
    let siteSettings

    getSiteSettings( req.user, req.session.currentSite._id )
      .then( settings => {
        siteSettings = settings || {}
      })
      .then( () => {
        if( siteSettings.restrict && !( id in siteSettings.pages ) ){
          throw new Error( 'User cannot edit this document' )
        }
      })
      .then( () => siteApi.getStyles( app.deps.stores, req.session.currentSite ) )
      .then( styleUrls => {
        siteStyles = styleUrls
      })
      .then( () => siteApi.getStore( app.deps.stores, req.session.currentSite ) )
      .then( store => {
        siteStore = store

        return store
      })
      .then( store => store.loadP( id ) )
      .then( root => {
        options = optionsFromRoot( root, req.session.currentSite )

        if( siteSettings.restrict ){
          options.user = req.user._id
          options.restrict = true
        }
      })
      .then( () => tryGetPageStyles( options.page, req.session.currentSite, siteStore ) )
      .then( pageStyleUrls => {
        const allStyleUrls = siteStyles.concat( pageStyleUrls )
        const model = composerModel( req.user, options, allStyleUrls, templatesDictionary )

        res.render( 'composer', model )
      })
      .catch( err => {
        logger.error( err )
        const status = utils.httpStatus._500InternalServerError
        res.status( status.code )
        res.render( 'error', { status: status, message: err.message })
      })
  }

  return {
    route: '/cms/composer/:id?',

    requireClaims: ['editPage'],

    get: ( req, res ) => {
      const id = req.params.id

      //if there is an id we would like to use the composer, else we want to see a list of
      //documents that can be opened in the composer
      if ( id ) {
        if ( !utils.isDbIdentifier( id ) ) {
          const status = utils.httpStatus._400BadRequest
          res.status( status.code )
          logger.warn( status.toFormat( req.url ) )
          res.render( 'error', { status: status, message: req.url })
          return
        }

        composer( req, res )
      } else {
        index( req, res )
      }
    }
  }
}
