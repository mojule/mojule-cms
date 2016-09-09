'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const FormModel = require( '../src/view-models/form-model' )
const RegisterModel = require( '../src/view-models/register-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )

const getViewModel = ( user, site, form, id ) => Object.assign(
  {
    title: 'mojule',
    icon: 'edit',
    subtitle: 'Edit Form',
    user: {
      email: user.email,
      id: user._id
    },
    id: id,
    form
  },
  new UiModel( site )
)

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  const defaultPost = ( req, res ) => {
    const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
    const id = req.params.id

    if ( !utils.isDbIdentifier( id ) ) {
      const status = utils.httpStatus._400BadRequest
      res.status( status.code )
      logger.warn( status.toFormat( req.url ) )
      res.render( 'error', { status: status, message: req.url })
      return
    }

    const site = req.session.currentSite

    let siteStore
    let formApi

    siteApi.getStore( app.deps.stores, site )
      .then( store => {
        siteStore = store
        formApi = require( '../src/api/form-api' )( site, siteStore )
      })
      .then(() => siteStore.loadP( id ) )
      .then( form => formApi.edit( form, req.body ) )
      .then( result => {
        if ( result.valid ) {
          res.redirect( '/cms/forms' )
        } else {
          const viewModel = getViewModel( req.user, req.session.currentSite, result.data, id )
          res.render( 'form-edit', viewModel )
        }
      })
      .catch( err => {
        logger.error( err )
        const status = utils.httpStatus._500InternalServerError
        res.status( status.code )
        res.render( 'error', { status: status, message: err.message })
      })
  }

  const formTypes = {
    email: {
      get: ( req, res ) => {
        const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
        const id = req.params.id

        const site = req.session.currentSite
        let siteStore

        siteApi.getStore( app.deps.stores, site )
          .then( store => { siteStore = store })
          .then(() => siteStore.getP( 'form' ) )
          .then( forms => {
            const form = forms.find( f => f._id === id )

            const names = forms.filter( f => f._id !== id ).map( f => f.name )

            const dynamicSchema = {
              name: {
                not: {
                  enum: names
                }
              }
            }

            const formOptions = {
              action: '/cms/forms/' + id,
              submitLabel: 'Update Form'
            }

            const formModel = FormModel( dynamicSchema )
            const formForm = formModel.form( formOptions, form )

            const viewModel = getViewModel( req.user, req.session.currentSite, formForm, id )

            res.render( 'form-edit', viewModel )
          })
          .catch( err => {
            logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          })
      }
    },
    register: {
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

        const user = req.user
        const site = req.session.currentSite
        const siteClaims = Array.isArray( site.claims ) ? site.claims : []

        let siteStore
        let pages

        siteApi.getStore( app.deps.stores, site )
          .then( store => { siteStore = store })
          .then(() => siteStore.getP( 'page' ) )
          .then( allPages => {
            pages = allPages
          })
          .then(() => siteStore.getP( 'form' ) )
          .then( forms => {
            const form = forms.find( f => f._id === id )

            const names = forms.filter( f => f._id !== id ).map( f => f.name )

            const pageRefs = pages.map( Reference )

            const editorClaims = siteClaims.map( claim => {
              const id = utils.toIdentifier( claim )
              return {
                name: claim,
                _id: id,
                selected: Array.isArray( form.claims ) && !!form.claims.find( c => c.name === claim ),
                icon: 'key'
              }
            })

            const dynamicSchema = {
              name: {
                not: {
                  enum: names
                }
              },
              claims: {
                items: {
                  enum: editorClaims
                }
              },
              loginPage: {
                enum: pageRefs
              },
              registerPage: {
                enum: pageRefs
              }
            }

            const formOptions = {
              action: '/cms/forms/' + id,
              submitLabel: 'Update Form'
            }

            const formModel = RegisterModel( dynamicSchema )
            const formForm = formModel.form( formOptions, form )

            const viewModel = getViewModel( req.user, req.session.currentSite, formForm, id )

            res.render( 'form-edit', viewModel )
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


  return {
    route: '/cms/forms/:id',

    requireClaims: ['editForm'],

    get: ( req, res ) => {
      const site = req.session.currentSite
      const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
      const id = req.params.id

      if ( !utils.isDbIdentifier( id ) ) {
        const status = utils.httpStatus._400BadRequest
        res.status( status.code )
        logger.warn( status.toFormat( req.url ) )
        res.render( 'error', { status: status, message: req.url })
        return
      }

      let siteStore

      siteApi.getStore( app.deps.stores, site )
        .then( store => { siteStore = store })
        .then(() => siteStore.loadP( id ) )
        .then( form => {
          if ( form.formType === 'register' ) {
            formTypes.register.get( req, res )

            return
          }

          //default fallback type, as older forms were all email forms and don't have a formType property
          formTypes.email.get( req, res )
        })
    },

    post: defaultPost
  }
}
