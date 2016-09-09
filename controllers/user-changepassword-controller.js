'use strict'

const path = require( 'path' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const ChangePasswordModel = require( '../src/view-models/change-password-model' )
const UserApi = require( '../src/api/user-api' )
const SiteApi = require( '../src/api/site-api' )
const emailer = require( '../src/email' )
const renderComponents = require( '../src/component-renderer' )
const utils = require( '../src/utils/utils' )

const getViewModel = ( site, form, message ) => {
  const viewModel = Object.assign(
    {
      title: 'mojule',
      icon: 'user',
      subtitle: 'Change Password'
    },
    new UiModel( site )
  )

  if ( message ) {
    viewModel.alert = message
  }

  if ( form ) {
    viewModel.form = form
  }

  return viewModel
}

const formOptions = {
  submitLabel: 'Change Password'
}

const message = {
  alertType: 'alert',
  message: 'Invalid, missing or expired token'
}

const render = ( app, components, req, res ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  renderComponents( app, components, req, res )
    .then( model => { res.render( 'page-render', model ) })
    .catch( err => {
      logger.error( err )
      res.status( 500 )
      res.render( 'error', { message: err.message })
    })
}

const formRender = ( app, form, req, res ) => {
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

  const components = [
    {
      key: 'html',
      values: {
        code: templates.panel( message )
      }
    }
  ]

  render( app, components, req, res )
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  const handlers = {
    token: {
      get: ( req, res ) => {
        const tokenId = req.query.token
        const site = req.session.currentSite
        const siteId = req.params.siteId
        let store
        const siteApi = SiteApi( DbStore, app.deps, req.session )

        if ( !tokenId ) {
          if ( siteId ) {
            messageRender( app, message, req, res )

            return
          }

          const viewModel = getViewModel( req.session.currentSite, {}, message )

          res.render( 'change-password', viewModel )

          return
        }

        Promise.resolve( siteId ? siteApi.getStore( app.deps.stores, site ) : app.deps.stores.cms )
          .then( currentStore => {
            store = currentStore
          })
          .then(() => store.loadP( tokenId ) )
          .then( token => {
            if ( token === null ) {
              throw new Error( message.message )
            } else {
              const now = new Date()
              const created = new Date( token.created )

              created.setDate( created.getDate() + 1 )

              if ( now > created ) {
                throw new Error( message.message )
              } else {
                const dynamicSchema = {
                  token: {
                    value: token._id
                  }
                }

                const changePasswordModel = ChangePasswordModel( dynamicSchema )

                const form = changePasswordModel.form( formOptions )

                if ( siteId ) {
                  formRender( app, form, req, res )

                  return
                }

                const viewModel = getViewModel( req.session.currentSite, form )

                res.render( 'change-password', viewModel )
              }
            }
          })
          .catch( err => {
            logger.error( err )

            if ( siteId ) {
              messageRender( app, message, req, res )
              return
            }

            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'change-password', getViewModel( req.session.currentSite, message ) )
          })
      },
      post: ( req, res ) => {
        const site = req.session.currentSite
        const siteId = req.params.siteId
        const changePasswordModel = ChangePasswordModel()
        const changePassword = changePasswordModel.assemble( req.body )
        const validate = changePasswordModel.validate( changePassword )

        if ( changePassword.password !== changePassword.confirmPassword ) {
          validate.errors.push( {
            dataPath: '/password',
            message: 'Should match "Confirm Password"'
          })
          validate.errors.push( {
            dataPath: '/confirmPassword',
            message: 'Should match "Password"'
          })
        }

        if ( validate.errors.length ) {
          const form = changePasswordModel.form( formOptions, changePassword, validate.errors )

          if ( siteId ) {
            formRender( app, form, req, res )

            return
          }

          const viewModel = getViewModel( req.session.currentSite, form )

          res.render( 'change-password', viewModel )

          return
        }

        const siteApi = SiteApi( DbStore, app.deps, req.session )

        Promise.resolve( siteId ? siteApi.getStore( app.deps.stores, site ) : app.deps.stores.cms )
          .then( store => UserApi( store, emailer ) )
          .then( userApi => userApi.changePassword( changePassword.token, changePassword.password ) )
          .then(() => {
            if ( siteId ) {
              const message = {
                successMessage: 'Your password was successfully changed.'
              }

              messageRender( app, message, req, res )
            } else {
              res.redirect( '/cms' )
            }
          })
          .catch( err => {
            if ( siteId ) {
              messageRender( app, message, req, res )
              return
            }

            res.render( 'change-password', getViewModel( req.session.currentSite, {}, message ) )
          })
      }
    },
    user: {
      get: ( req, res ) => {
        const site = req.session.currentSite
        const siteId = req.params.siteId
        let store
        const siteApi = SiteApi( DbStore, app.deps, req.session )

        Promise.resolve( siteId ? siteApi.getStore( app.deps.stores, site ) : app.deps.stores.cms )
          .then( currentStore => {
            store = currentStore
          })
          .then(() => {
            const dynamicSchema = {
              token: {
                value: utils.randomId( 'token' )
              }
            }

            const changePasswordModel = ChangePasswordModel( dynamicSchema )

            const form = changePasswordModel.form( formOptions )

            if ( siteId ) {
              formRender( app, form, req, res )

              return
            }

            const viewModel = getViewModel( req.session.currentSite, form )

            res.render( 'change-password', viewModel )
          })
          .catch( err => {
            logger.error( err )

            message.message = err.message

            if ( siteId ) {

              messageRender( app, message, req, res )
              return
            }

            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'change-password', getViewModel( req.session.currentSite, message ) )
          })
      },
      post: ( req, res ) => {
        const site = req.session.currentSite
        const siteId = req.params.siteId
        const changePasswordModel = ChangePasswordModel()
        const changePassword = changePasswordModel.assemble( req.body )
        const validate = changePasswordModel.validate( changePassword )

        if ( changePassword.password !== changePassword.confirmPassword ) {
          validate.errors.push( {
            dataPath: '/password',
            message: 'Should match "Confirm Password"'
          })
          validate.errors.push( {
            dataPath: '/confirmPassword',
            message: 'Should match "Password"'
          })
        }

        if ( validate.errors.length ) {
          const form = changePasswordModel.form( formOptions, changePassword, validate.errors )

          if ( siteId ) {
            formRender( app, form, req, res )

            return
          }

          const viewModel = getViewModel( req.session.currentSite, form )

          res.render( 'change-password', viewModel )

          return
        }

        const siteApi = SiteApi( DbStore, app.deps, req.session )

        Promise.resolve( siteId ? siteApi.getStore( app.deps.stores, site ) : app.deps.stores.cms )
          .then( store => UserApi( store, emailer ) )
          .then( userApi => userApi.changePassword( changePassword.token, changePassword.password, req.user ) )
          .then(() => {
            if ( siteId ) {
              const message = {
                successMessage: 'Your password was successfully changed.'
              }

              messageRender( app, message, req, res )
            } else {
              res.redirect( '/cms' )
            }
          })
          .catch( err => {
            message.message = err.message

            if ( siteId ) {
              messageRender( app, message, req, res )
              return
            }

            res.render( 'change-password', getViewModel( req.session.currentSite, {}, message ) )
          })
      }
    }
  }

  return {
    route: '/cms/changepassword/:siteId?',

    isPublic: true,

    get: ( req, res ) => {
      if ( req.user ) {
        handlers.user.get( req, res )
        return
      }

      handlers.token.get( req, res )
    },
    post: ( req, res ) => {
      if ( req.user ) {
        handlers.user.post( req, res )
        return
      }

      handlers.token.post( req, res )
    }
  }
}
