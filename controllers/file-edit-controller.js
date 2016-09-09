'use strict'

const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const FileModel = require( '../src/view-models/file-edit-model' )
const utils = require( '../src/utils/utils' )
const path = require( 'path' )

const fileModel = FileModel()

const fileOptions = {
  multipart: true,
  submitLabel: 'Update File'
}

const getViewModel = ( user, site, fileApi, file, form, success ) => {
  const imageApi = require( '../src/api/image-api' )()

  const filePreview = {
    name: file.originalname,
    actions: [
      {
        text: 'Download',
        icon: '<i class="fa fa-download"></i>',
        classes: 'secondary',
        url: fileApi.getUrl( file ),
        attrs: [
          {
            key: 'download',
            value: file.originalname
          }
        ]
      },
      {
        text: 'Delete',
        icon: '<i class="fa fa-trash"></i>',
        classes: 'alert',
        url: '/cms/files/trash/' + file._id
      }
    ]
  }

  if ( imageApi.isImage( file ) ) {
    filePreview.preview = {
      fullsizeUrl: imageApi.getUrl( file ),
      url: imageApi.getUrl( file, { strategy: 'fitToWidth', width: 512 })
    }
  }

  const viewModel = Object.assign(
    {
      title: 'mojule',
      icon: 'file',
      subtitle: 'Edit File',
      user: {
        email: user.email,
        id: user._id
      },
      filePreview,
      form
    },
    new UiModel( site )
  )

  if ( success ) {
    viewModel.success = success
  }

  return viewModel
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/files/:id',

    isUpload: true,

    requireClaims: ['editFile'],

    get: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      fileOptions.action = '/cms/files/' + id

      let fileApi

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => {
          fileApi = require( '../src/api/file-api' )( siteStore, req.session.currentSite )

          return siteStore
        })
        .then( siteStore => siteStore.loadP( id ) )
        .then( file => {
          const tags = Array.isArray( file.tags ) ? file.tags : []

          const body = {
            'file.tags': tags
          }

          const model = fileModel.assemble( body )
          const success = req.flash( 'success' )

          res.render( 'file-edit', getViewModel(
            req.user,
            req.session.currentSite,
            fileApi,
            file,
            fileModel.form( fileOptions, model ),
            success
          ) )
        })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    },

    post: ( req, res ) => {
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const id = req.params.id
      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      fileOptions.action = '/cms/files/' + id

      let fileApi

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => {
          fileApi = require( '../src/api/file-api' )( siteStore, req.session.currentSite )

          return siteStore
        })
        .then( siteStore => siteStore.loadP( id ) )
        .then( file =>
          fileApi.edit( file, req.body, req.file )
        )
        .then(() => {
          req.flash( 'success', 'File was updated' )
          res.redirect( fileOptions.action )
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
