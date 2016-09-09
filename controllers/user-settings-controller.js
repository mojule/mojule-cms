'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const emailer = require( '../src/email' )
const UiModel = require( '../models/ui-model' )
const UserModel = require( '../src/view-models/user-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )
const SiteApi = require( '../src/api/site-api' )
const UserApi = require( '../src/api/user-api' )
const PageClaimsModel = require( '../src/view-models/page-claims-model' )
const templateNames = require( '../src/template-names' )
const Tree = require( '../src/tree' )

const getViewModel = ( editor, user, site, form, templatesDictionary ) => Object.assign(
  {
    title: 'mojule',
    icon: 'cog',
    subtitle: user.email,
    user: {
      email: editor.email,
      id: editor._id
    },
    form,
    templates: templateNames.common.concat( templateNames.composer ).map( key => {
      return {
        key,
        template: templatesDictionary[key].template
      }
    }),
    id: user._id
  },
  new UiModel( site )
)

const docFromPage = ( siteStore, pageId ) => siteStore.loadP( pageId )
  .then( page => page.document )
  .then( documentId => siteStore.loadP( documentId ) )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  //ffs
  const setDocumentAccess = ( siteStore, userId, pageAccessSettings ) => {
    const pageIds = Object.keys( pageAccessSettings )

    return Promise.all( pageIds.map( pageId => {
      const componentIds = pageAccessSettings[pageId]

      return docFromPage( siteStore, pageId )
        .then( document => {
          Tree( document ).walk( node => {
            if ( Array.isArray( node.values.editors ) ) {
              node.values.editors = node.values.editors.filter( id => id !== userId )
            }

            if ( componentIds.includes( node._id ) ) {
              if ( !Array.isArray( node.values.editors ) ) {
                node.values.editors = []
              }

              node.values.editors.push( userId )
            }
          })

          return document
        })
        .then( document => siteStore.saveP( document ) )
    }) )
  }

  const getDocumentAccess = ( siteStore, userId, pageIds ) => {
    return Promise.all( pageIds.map( pageId => {
      return docFromPage( siteStore, pageId )
        .then( doc => {
          return {
            document: doc,
            pageId
          }
        })
    }) ).then( docData => {
      return docData.reduce(( access, data ) => {
        access[data.pageId] = []

        Tree( data.document ).walk( node => {
          if ( Array.isArray( node.values.editors ) && node.values.editors.includes( userId ) ) {
            access[data.pageId].push( node._id )
          }
        })

        return access
      }, {})
    })
  }

  return {
    route: '/cms/user-settings/:id',

    requireClaims: ['editUser'],

    get: ( req, res ) => {
      const id = req.params.id

      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const cmsStore = app.deps.stores.cms

      const userApi = UserApi( cmsStore, emailer )

      let user
      let userSettings
      let siteSettings
      let siteStore
      let pages
      let form
      let userPages = {}

      cmsStore.loadP( id ).then( loadedUser => {
        user = loadedUser
      }).then(() => {
        return userApi.settings( user )
      }).then( loadedUserSettings => {
        userSettings = loadedUserSettings
        siteSettings = userSettings.site[req.session.currentSite._id] || {}
      }).then(() => {
        if ( siteSettings.pages ) {
          userPages = siteSettings.pages
        }
      }).then(() => {
        return siteApi.getStore( app.deps.stores, req.session.currentSite )
      }).then( store => {
        siteStore = store
      }).then(() => {
        const pageIds = Object.keys( userPages )

        return getDocumentAccess( siteStore, id, pageIds )
      }).then( documentAccess => {
        userPages = documentAccess
      }).then(() => {
        return siteStore.getP( 'page' )
      }).then( sitePages => {
        pages = sitePages
      }).then(() => {
        const pageReferences = pages.map( page => {
          const ref = Reference( page )

          ref.selected = ( page._id in userPages )
          ref.icon = 'sitemap'

          return ref
        })

        const schemaData = {
          pages: {
            items: {
              enum: pageReferences
            }
          },
          restrict: {
            value: siteSettings.restrict
          },
          components: {
            value: JSON.stringify( userPages )
          }
        }

        const formOptions = {
          action: '/cms/user-settings/' + id,
          submitLabel: 'Update User Settings'
        }

        const pageClaimsModel = PageClaimsModel( schemaData )
        const form = pageClaimsModel.form( formOptions )

        const templateDictionary = app['template-engine'].templates.dictionary
        const viewModel = getViewModel( req.user, user, req.session.currentSite, form, templateDictionary )

        viewModel.headStyles.push( { url: '/files/css' })

        res.render( 'user-settings', viewModel )
      }).catch( err => {
        logger.error( err )
        const status = utils.httpStatus._500InternalServerError
        res.status( status.code )
        res.render( 'error', { status: status, message: err.message })
      })
    },
    post: ( req, res ) => {
      const id = req.params.id

      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const cmsStore = app.deps.stores.cms

      const userApi = UserApi( cmsStore, emailer )

      let user
      let userSettings
      let siteSettings
      let siteStore
      let pages
      let form
      let userPages = {}

      cmsStore.loadP( id ).then( loadedUser => {
        user = loadedUser
      }).then(() => {
        return userApi.settings( user )
      }).then( loadedUserSettings => {
        userSettings = loadedUserSettings
        siteSettings = userSettings.site[req.session.currentSite._id] || {}
      }).then(() => {
        if ( siteSettings.pages ) {
          userPages = siteSettings.pages
        }
      }).then(() => {
        return siteApi.getStore( app.deps.stores, req.session.currentSite )
      }).then( store => {
        siteStore = store
      }).then(() => {
        return siteStore.getP( 'page' )
      }).then( sitePages => {
        pages = sitePages
      }).then(() => {
        const pageReferences = pages.map( page => {
          const ref = Reference( page )

          ref.selected = ( page._id in userPages )
          ref.icon = 'sitemap'

          return ref
        })

        const schemaData = {
          pages: {
            items: {
              enum: pageReferences
            }
          },
          restrict: {
            value: siteSettings.restrict
          },
          components: {
            value: JSON.stringify( userPages )
          }
        }

        const pageClaimsModel = PageClaimsModel( schemaData )

        const pageClaims = pageClaimsModel.assemble( req.body )

        const validation = pageClaimsModel.validate( pageClaims )

        if ( validation.errors.length > 0 ) {
          const formOptions = {
            action: '/cms/user-settings/' + id,
            submitLabel: 'Update User Settings'
          }

          const form = pageClaimsModel.form( formOptions, pageClaims, validation.errors )

          const templateDictionary = app['template-engine'].templates.dictionary
          const viewModel = getViewModel( req.user, user, req.session.currentSite, form, templateDictionary )

          viewModel.headStyles.push( { url: '/files/css' })

          res.render( 'user-settings', viewModel )

          return
        }

        const pageComponents = JSON.parse( pageClaims.components )
        const pageClaimsSettings = {
          restrict: pageClaims.restrict,
          pages: {}
        }

        pageClaims.pages.forEach( ref => {
          let comp = []
          if ( ref._id in pageComponents ) {
            comp = pageComponents[ref._id]
          }
          pageClaimsSettings.pages[ref._id] = comp
        })

        userSettings.site[req.session.currentSite._id] = pageClaimsSettings

        return cmsStore.saveP( userSettings )
          .then(() => setDocumentAccess( siteStore, id, pageComponents ) )
      }).then(() => {
        res.redirect( '/cms/users/' + id )
      }).catch( err => {
        logger.error( err )
        const status = utils.httpStatus._500InternalServerError
        res.status( status.code )
        res.render( 'error', { status: status, message: err.message })
      })
    }
  }
}
