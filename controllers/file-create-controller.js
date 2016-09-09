'use strict'

const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const FileModel = require( '../src/view-models/file-model' )
const path = require( 'path' )

const fileModel = FileModel()

const fileOptions = {
  multipart: true,
  submitLabel: 'Upload File'
}

const getViewModel = ( user, site, form ) =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'file',
      subtitle: 'New File',
      user: {
        email: user.email,
        id: user._id
      },
      form
    },
    new UiModel( site )
  )

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  return {
    route: '/cms/files/create',

    requireClaims: ['createFile'],

    isUpload: true,

    get: ( req, res ) => {
      res.render( 'file-create', getViewModel(
        req.user,
        req.session.currentSite,
        fileModel.form( fileOptions )
      ) )
    },

    post: ( req, res ) => {
      if ( !req.file ) {
        const errors = [{
          dataPath: '/file',
          message: 'At least one file must be selected'
        }]

        const model = fileModel.assemble( req.body )
        const form = fileModel.form( fileOptions, model, errors )

        res.render( 'file-create', getViewModel(
          req.user,
          req.session.currentSite,
          form
        ) )

        return
      }

      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )

      siteApi.getStore( app.deps.stores, req.session.currentSite )
        .then( siteStore => require( '../src/api/file-api' )( siteStore, req.session.currentSite ) )
        .then( fileApi => fileApi.create( req.user, req.body, [req.file] ) )
        .then(() => {
          res.redirect( '/cms/files' )
        })
        .catch(        err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
