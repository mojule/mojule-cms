'use strict'

const path = require( 'path' )
const UiModel = require( '../models/ui-model' )
const PageRenderModel = require( '../models/page-render-model' )
const LoginModel = require( '../src/view-models/login-model' )
const SiteApi = require( '../src/api/site-api' )
const DbStore = require( '../src/db-store' )
const DbItem = require( '../src/db/db-item' )
const utils = require( '../src/utils/utils' )
const renderComponents = require( '../src/component-renderer' )

const loginModel = LoginModel()

const getModel = form =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'sign-in',
      subtitle: 'Login',
      form
    },
    new UiModel()
  )

const formOptions = {
  submitLabel: 'Login'
}

const formAction = siteId => {
  let action = '/cms/login/'

  if ( typeof siteId === 'string' ) {
    action += siteId + '/'
  }

  action += '?p=' + utils.randomHex( 32 )

  return action
}

const siteLogin = ( app, form, req, res ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )
  const site = req.session.currentSite
  const siteApi = SiteApi( DbStore, app.deps, req.session )
  const templates = app['template-engine'].templates

  const forgotPasswordLink = '<a href="/cms/resetpassword/' + site._id + '">Forgot Password</a>'
  let registerLink = ''

  const linksComponent = {
    key: 'html',
    values: {
      code: ''
    }
  }

  const loginComponents = [
    {
      key: 'html',
      values: {
        code: templates.form( { form })
      }
    },
    linksComponent
  ]

  let styles
  let siteStore

  siteApi.getStore( app.deps.stores, site )
    .then( store => { siteStore = store })
    .then(() => siteStore.getP( 'form' ) )
    .then( forms => {
      const registerForm = forms.find( f => f.formType === 'register' )

      if ( registerForm && registerForm.registerPage ) {
        registerLink = ' | <a href="' + registerForm.registerPage._id + '">Register</a>'
      }

      linksComponent.values.code = '<p>' + forgotPasswordLink + registerLink + '</p>'
    })
    .then(() => renderComponents( app, loginComponents, req, res ) )
    .then( model => {
      res.render( 'page-render', model )
    })
    .catch( err => {
      logger.error( err )
      const status = utils.httpStatus._404NotFound
      res.status( status.code )
      logger.error( status.toFormat( req.url ) )
      res.render( 'error', { status: status, message: req.url })
    })
}

module.exports = ( app, passport ) => {
  return {
    route: '/cms/login/:siteId?',

    isPublic: true,

    isExcludeSiteClaims: true,

    get: ( req, res ) => {
      const siteId = req.params.siteId

      //disallow already logged in users
      if ( req.user ) {
        let redirectUrl = '/cms'

        if ( req.user.isSiteUser ) {
          redirectUrl = redirectUrl = '/'
        }

        res.redirect( redirectUrl )

        return
      }

      formOptions.action = formAction( siteId )

      const form = loginModel.form( formOptions )

      const flashErrors = req.flash( 'error' )

      if ( Array.isArray( flashErrors ) && flashErrors.length > 0 ) {
        const errors = flashErrors.join( '. ' ).trim()

        if ( errors !== '' ) {
          form.message = {
            alertType: 'error',
            name: 'loginForm',
            message: errors
          }
        }
      }

      if ( siteId ) {
        siteLogin( app, form, req, res )

        return
      }

      const model = getModel( form )
      const error = req.flash( 'error' )

      if ( error.length ) {
        model.form.message = error.join( '. ' )
      }

      res.render( 'login', model )
    },

    post: ( req, res ) => {
      const siteId = req.params.siteId

      let failure = '/cms/login'
      if ( siteId ) {
        failure += '/' + siteId
      }

      const login = loginModel.assemble( req.body )
      const validate = loginModel.validate( login )

      if ( validate.errors.length ) {
        delete login.password

        formOptions.action = formAction( siteId )

        const form = loginModel.form( formOptions, login, validate.errors )

        if ( siteId ) {
          siteLogin( app, form, req, res )

          return
        }

        const model = getModel( form )

        res.render( 'login', model )
      } else {
        let redirectUrl = '/cms/return'

        passport.authenticate( 'local', {
          successRedirect: redirectUrl,
          failureRedirect: failure,
          failureFlash: true
        })( req, res )
      }
    }
  }
}
