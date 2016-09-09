'use strict'

const UiModel = require( '../models/ui-model' )
const claims = require( '../src/claims' )
const path = require( 'path' )
const utils = require( '../src/utils/utils' )
const UserApi = require( '../src/api/user-api' )
const emailer = require( '../src/email' )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  return {
    route: '/cms',

    get: ( req, res ) => {
      if ( req.user.isSiteUser ) {
        const status = utils.httpStatus._403Forbidden
        logger.warn( status.toFormat( 'Access forbidden' ) )
        res.status( status.code )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      const userApi = UserApi( app.deps.stores.cms, emailer )

      let items = [
        {
          url: '/cms/sites',
          icon: 'globe',
          title: 'Sites',
          requireClaims: ['editSite']
        }
      ]

      if ( req.session.currentSite ) {
        items = items.concat( [
          {
            url: '/cms/composer',
            icon: 'magic',
            title: 'Composer',
            requireClaims: ['editPage']
          },
          {
            url: '/cms/pages',
            icon: 'sitemap',
            title: 'Pages',
            requireClaims: ['editPage']
          },
          {
            url: '/cms/templates',
            icon: 'puzzle-piece',
            title: 'Prefabs',
            requireClaims: ['editTemplate']
          },
          {
            url: '/cms/forms',
            icon: 'edit',
            title: 'Forms',
            requireClaims: ['editForm']
          },
          {
            url: '/cms/files',
            icon: 'file-o',
            title: 'Files',
            requireClaims: ['editFile']
          },
          {
            url: '/cms/users',
            icon: 'user',
            title: 'CMS Users',
            requireClaims: ['editUser']
          },
          {
            url: '/cms/siteusers',
            icon: 'users',
            title: 'Site Users',
            requireClaims: ['editUser']
          },
          {
            url: '/cms/logs',
            icon: 'book',
            title: 'Logs',
            requireClaims: ['master']
          },
          {
            url: '/cms/info',
            icon: 'info',
            title: 'Info',
            requireClaims: [ 'master' ]
          }
        ] )
      }

      items = claims.filterByClaims( items, req.user.claims )

      userApi.settings( req.user )
        .then( settings => {
          if( req.session.currentSite ){
            const siteSettings = settings.site[ req.session.currentSite._id ]

            if( siteSettings && siteSettings.restrict ){
              items = items.filter( i => i.url !== '/cms/pages' )
            }
          }

          const model = Object.assign(
            {
              title: 'mojule',
              icon: 'home',
              subtitle: 'Home',
              user: {
                email: req.user.email,
                id: req.user._id
              },
              library: {
                size: 5,
                items: items
              }
            },
            new UiModel( req.session.currentSite )
          )

          res.render( 'ui-home', model )
        }).catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
