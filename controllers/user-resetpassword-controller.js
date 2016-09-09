'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const utils = require( '../src/utils/utils' )
const UiModel = require( '../models/ui-model' )
const PageRenderModel = require( '../models/page-render-model' )
const emailer = require( '../src/email' )
const ResetPasswordModel = require( '../src/view-models/reset-password-model' )
const UserApi = require( '../src/api/user-api' )
const SiteApi = require( '../src/api/site-api' )
const renderComponents = require( '../src/component-renderer' )

const resetPasswordModel = ResetPasswordModel()

const getViewModel = ( site, form, message ) => {
  const viewModel = Object.assign(
    {
      title: 'mojule',
      icon: 'sign-in',
      subtitle: 'Reset Password'
    },
    new UiModel( site )
  )

  if ( message ) {
    viewModel.alert = message
  }

  if ( !message || message.showForm ) {
    viewModel.form = form
  }

  return viewModel
}

const formOptions = {
  submitLabel: 'Send Reset Email'
}

const render = ( app, components, req, res ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  renderComponents( app, components, req, res )
    .then( model => {
      res.render( 'page-render', model )
    })
    .catch( err => {
      logger.error( err )
      res.status( 500 )
      res.render( 'error', { message: err.message })
    })
}

const siteRender = ( app, form, req, res ) => {
  const templates = app['template-engine'].templates

  const formComponents = [
    {
      key: 'html',
      values: {
        code: templates.form( { form })
      }
    }
  ]

  render( app, formComponents, req, res )
}

const messageRender = ( app, message, req, res ) => {
  const templates = app['template-engine'].templates

  const panel = {
    name: 'forgotPassword',
    successMessage: message
  }

  const components = [
    {
      key: 'html',
      values: {
        code: templates.panel( panel )
      }
    }
  ]

  render( app, components, req, res )
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const store = app.deps.stores.cms

  return {
    route: '/cms/resetpassword/:siteId?',

    isPublic: true,

    get: ( req, res ) => {
      const form = resetPasswordModel.form( formOptions )

      const siteId = req.params.siteId

      if ( siteId ) {
        siteRender( app, form, req, res )

        return
      }

      res.render( 'reset-password', getViewModel( req.session.currentSite, form ) );
    },

    post: ( req, res ) => {
      const site = req.session.currentSite
      const siteId = req.params.siteId
      const resetPassword = resetPasswordModel.assemble( req.body )
      const validate = resetPasswordModel.validate( resetPassword )

      if ( validate.errors.length ) {
        const form = resetPasswordModel.form( formOptions, resetPassword, validate.errors )

        if ( siteId ) {
          siteRender( app, form, req, res )

          return
        }

        res.render( 'reset-password', getViewModel( req.session.currentSite, form ) )

        return
      }

      const message = 'Password reset link sent, please check your email.'

      const viewModel = getViewModel( req.session.currentSite, {}, {
        alertType: 'success',
        message
      })

      const siteUrl = req.protocol + '://' + req.get( 'host' )

      let userApi

      if ( siteId ) {
        const siteApi = SiteApi( DbStore, app.deps, req.session )

        let siteStore
        let userApi

        siteApi.getStore( app.deps.stores, site )
          .then( store => { siteStore = store })
          .then(() => { userApi = UserApi( siteStore, emailer ) })
          .then(() => userApi.resetPassword( resetPassword.email, siteUrl, siteId ) )
          .then(() => { messageRender( app, message, req, res ) })
          .catch( err => {
            logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          })
        return
      }

      userApi = UserApi( store, emailer )

      userApi.resetPassword( resetPassword.email, siteUrl )
        .then(() => { res.render( 'reset-password', viewModel ) })
        .catch( err => {
          logger.error( err )
          const status = utils.httpStatus._500InternalServerError
          res.status( status.code )
          res.render( 'error', { status: status, message: err.message })
        })
    }
  }
}
