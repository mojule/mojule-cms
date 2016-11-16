'use strict'

const multer = require( 'multer' )
const utils = require( './src/utils/utils' )
const claims = require( './src/claims' )
const SiteApi = require( './src/api/site-api' )
const CmsApi = require( './src/api/cms-api' )
const Store = require( './src/db-store' )
const initCms = require( './src/init-cms' )

/*
  Controller structure:

     {
       //standard express routing format, including wildcards etc.
       route: '/some/route',

       //if omitted will require that the user is logged in
       isPublic: true,

       //if omitted/false and the controller is public, site claims (eg custom claims) will be enforced
       //currently only the case for the login controller
       isExcludeSiteClaims: true,

       //if the controller accepts an upload from a form, this must be true
       isUpload: true,

       //if this is present (note that using this and isPublic: true together makes no sense and claims will be ignored) then enforce the claims
       requireClaims: [ 'editPage', ... ],

       //if this is present, use it to handle gets for this route
       get: ( req, res ) => { ... },

       //if this is present, use it to handle posts to this route
       post: ( req, res ) => { ... }
     }
*/

const storage = multer.diskStorage( {
  destination: ( req, file, cb ) => {
    cb( null, 'uploads/' )
  },

  filename: ( req, file, cb ) => {
    const id = [
      utils.randomId( 'upload' ),
      file.originalname
    ].join( '-' )

    cb( null, id )
  }
})

const upload = multer( { storage } )

module.exports = ( app, passport ) => {
  const controllerNames = [
    'cms', 'login', 'logout', 'return', 'backup',
    'site', 'site-create', 'site-current', 'site-backup', 'site-import', 'site-edit',
    'sitemap',
    'user', 'user-create', 'user-resetpassword', 'user-changepassword', 'user-edit', 'user-settings',
    'siteuser', 'siteuser-create', 'siteuser-download', 'siteuser-upgrade', 'siteuser-edit',
    //should be before file-view controller to stop it catching these routes
    'file', 'file-create', 'file-zip', 'file-edit', 'file-trash', 'file-css',
    'file-view',
    'page', 'page-create', 'page-edit',
    'form', 'form-create', 'form-edit', 'form-action',
    'composer', 'composer-document',
    'template', 'template-create', 'template-edit',
    'store',
    'plugin', 'plugin-script',
    'db',
    'log', 'log-clear-all', 'log-view', 'info',
    'abstract-composer', 'image-loader',
    //must be last
    'home'
  ]

  const controllers = controllerNames.map( key => require( './controllers/' + key + '-controller' )( app, passport ) )

  const enforceLogin = ( req, res, next ) => {
    if ( !req.user ) {
      req.session.returnPath = req.url
      res.redirect( '/cms/login' )
      return
    }

    next()
  }

  const setCurrentSite = ( req, res, next ) => {
    const siteApi = SiteApi( Store, app.deps, req.session )
    const fullUrl = req.protocol + '://' + req.get( 'host' ) + req.originalUrl

    siteApi.getSite( req.user, fullUrl )
      .then( site => {
        req.session.currentSite = site
        next()
      })
      .catch( err => {
        app.deps.logger.error( err )
        next()
      })
  }

  controllers.forEach( controller => {
    //guard against having both claims and isPublic: true on a controller
    //claims negates isPublic
    if ( controller.isPublic && Array.isArray( controller.claims ) ) {
      controller.isPublic = false
    }

    const restoreCms = ( req, res, next ) => {
      const cmsApi = CmsApi( Store, app.deps, req.session )

      initCms( cmsApi )
        .then( () => next() )
        .catch( err => {
          app.deps.logger.error( err )
          next()
        })
    }

    const enforceClaims = ( req, res, next ) => {
      if ( Array.isArray( controller.requireClaims ) && !claims.hasClaims( req.user, controller.requireClaims ) ) {
        throw Error( 'User does not have appropriate claims to access this controller' )
      } else {
        next()
      }
    }

    const enforceSiteClaims = ( req, res, next ) => {
      if ( controller.isExcludeSiteClaims ) {
        next()
        return
      }

      const site = req.session.currentSite

      const fail = () => {
        const status = utils.httpStatus._403Forbidden
        const err = new Error( 'Access Forbidden' )
        app.deps.logger.error( status.toFormat( err.message ))
        res.status( status.code )
        res.render( 'error', { status: status, message: req.url })
      }

      const siteHasClaims = Array.isArray( site.claims ) && site.claims.length > 0

      if ( !siteHasClaims ) {
        next()

        return
      }

      const siteApi = SiteApi( Store, app.deps, req.session )

      siteApi.getStore( app.deps.stores, site )
        .then( store => {
          const pageApi = require( './src/api/page-api' )( site, store, req.session )

          return pageApi.getPage( req.path )
        })
        .then( page => {
          const isPageRoute = !!page

          const pageHasClaims = Array.isArray( page.requireClaims ) && page.requireClaims.length > 0

          if ( !pageHasClaims ) {
            next()

            return
          }

          const user = req.user

          const userIsLoggedIn = !!user

          if ( !userIsLoggedIn ) {
            req.session.returnPath = req.url
            res.redirect( '/cms/login/' + site._id )

            return
          }

          const isCmsUser = !user.isSiteUser

          if ( isCmsUser ) {
            const hasSites = Array.isArray( user.sites ) && user.sites.length > 0

            if ( !hasSites ) {
              fail()

              return
            }

            const siteIds = user.sites.map( ref => ref._id )

            const cmsUserHasSite = siteIds.includes( site._id )

            if ( cmsUserHasSite ) {
              next()
            } else {
              fail()
            }

            return
          }

          const userHasClaims = Array.isArray( user.claims ) && user.claims.length > 0

          if ( !userHasClaims ) {
            fail()

            return
          }

          const requiredClaims = page.requireClaims.map( c => c.name )
          const userClaims = user.claims.map( c => c.name )
          const hasRequiredClaims = requiredClaims.every( claim => userClaims.includes( claim ) )

          if ( hasRequiredClaims ) {
            next()
          } else {
            fail()
          }
        })
        .catch( err => {
          if ( err.status === 404 ) {
            next()
          } else {
            app.deps.logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          }
        })
    }

    if ( controller.get ) {
      if ( controller.isPublic ) {
        app.get( controller.route, setCurrentSite, enforceSiteClaims, controller.get )
      } else {
        // only call restore cms when logged into CMS
        app.get( controller.route, enforceLogin, enforceClaims, setCurrentSite, restoreCms, controller.get )
      }
    }

    if ( controller.post ) {
      if ( controller.isPublic ) {
        app.post( controller.route, setCurrentSite, enforceSiteClaims, controller.post )
      } else if ( controller.isUpload ) { //currently no provision for uploading on public facing controllers
        app.post( controller.route, enforceLogin, enforceClaims, setCurrentSite, upload.single( controller.uploadFieldname || 'file.file' ), controller.post )
      } else {
        app.post( controller.route, enforceLogin, enforceClaims, setCurrentSite, controller.post )
      }
    }
  })
}
