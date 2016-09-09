'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const ZipFileModel = require( '../src/view-models/zip-file-model' )

const fileModel = ZipFileModel()

const fileOptions = {
  multipart: true,
  submitLabel: 'Upload Backup ZIP'
}

//for fuck's sake - this is a list of all mimetypes browsers have given us for zip files
//so much for standards huh
const accepted = [
  'application/x-zip',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-compressed'
]

const getViewModel = ( user, site, form ) =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'file-zip-o',
      subtitle: 'Restore Site Backup',
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
    route: '/cms/sites/import',

    requireClaims: ['createSite'],

    isUpload: true,

    uploadFieldname: 'zipFile.file',

    get: ( req, res ) => {
      const viewModel = getViewModel(
        req.user,
        req.session.currentSite,
        fileModel.form( fileOptions )
      )

      res.render( 'file-create', viewModel )
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

      if ( accepted.indexOf( req.file.mimetype ) === -1 ) {
        const errors = [{
          dataPath: '/file',
          message: 'The file must be a zip file; found ' + req.file.mimetype
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

      const cmsApi = require( '../src/api/cms-api' )( DbStore, app.deps, req.session )

      cmsApi.restoreSite( req.file.path )
        .then(() => { res.redirect( '/cms/sites' ) })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
