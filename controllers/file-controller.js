'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const tagsApi = require( '../src/tags' )()

const iconSize = 5
const gridWidth = 5
const imageSize = Math.floor( 1000 / gridWidth )

const items = [
  {
    url: '/cms/files/create',
    title: 'Upload File',
    icon: 'plus-circle',
    className: 'primary-action',
    size: iconSize,
    requireClaims: ['createFile']
  },
  {
    url: '/cms/files/zip',
    title: 'Upload Multiple',
    icon: 'file-zip-o',
    className: 'primary-action',
    size: iconSize,
    requireClaims: ['createFile']
  }
]

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const imageApi = require( '../src/api/image-api' )()

  return {
    route: '/cms/files',

    requireClaims: ['editFile'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      let siteStore
      let fileApi

      const decorateWithImage = ( viewItem, file ) => {
        viewItem.image = imageApi.getUrl( file, {
          strategy: 'fitToRect',
          width: imageSize,
          height: imageSize
        })

        viewItem.alt = file.originalname

        viewItem.data.push( {
          key: 'image'
        })

        return imageApi.getRatio( file )
          .then( ratio => {
            viewItem.ratio = ratio

            return Promise.resolve( viewItem )
          })
      }

      const decorateWithFile = ( viewItem, file ) => {
        viewItem.icon = fileApi.getIcon( file )
        viewItem.size = iconSize

        return Promise.resolve( viewItem )
      }

      const fileToViewItem = file => {
        const tags = fileApi.getTags( file )

        const viewItem = {
          url: '/cms/files/' + file._id,
          title: file.originalname,
          requireClaims: ['editFile'],
          data: [{
            key: 'tags',
            value: tags.join( ' ' )
          }],
          tags
        }

        if ( imageApi.isImage( file ) ) {
          return decorateWithImage( viewItem, file )
        } else {
          return decorateWithFile( viewItem, file )
        }
      }

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( store => {
          fileApi = require( '../src/api/file-api' )( store )
          siteStore = store

          return store
        })
        .then( store => store.getP( 'file' ) )
        .then( files =>
          Promise.all(
            files
              .sort( f => f.originalname )
              .sort( f => f.mimetype )
              .map( fileToViewItem )
          )
        )
        .then( viewItems => {
          const uiModel = new UiModel( req.session.currentSite )

          uiModel.scripts.push( {
            url: '/js/filter-tags.js'
          })

          const model = Object.assign(
            {
              title: 'mojule',
              icon: 'file',
              subtitle: 'Files',
              user: {
                email: req.user.email,
                id: req.user._id
              },
              library: {
                small: true,
                size: gridWidth,
                items: items.concat( viewItems )
              },
              tags: tagsApi.viewModels( viewItems )
            },
            uiModel
          )

          res.render( 'file-list', model );
        })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
