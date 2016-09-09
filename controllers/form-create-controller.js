'use strict'

const path = require( 'path' )
const claims = require( '../src/claims' )
const DbStore = require( '../src/db-store' )
const UiModel = require( '../models/ui-model' )
const Reference = require( '../src/form-models/reference' )
const utils = require( '../src/utils/utils' )

const getViewModel = ( user, site, form ) =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'edit',
      subtitle: 'New Form',
      user: {
        email: user.email,
        id: user._id
      },
      form
    },
    new UiModel( site )
  )

const getFormTypesViewModel = ( user, site, items ) =>
  Object.assign(
    {
      title: 'mojule',
      icon: 'edit',
      subtitle: 'New Form',
      user: {
        email: user.email,
        id: user._id
      },
      library: {
        size: 4,
        items
      }
    },
    new UiModel( site )
  )

const formOptions = {
  submitLabel: 'Create Form'
}

module.exports = ( app, passport ) => {
  const logger = app.deps.logger.child( path.relative( process.cwd(), __filename ) )

  const defaultPost = ( req, res ) => {
    const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
    const site = req.session.currentSite

    siteApi.getStore( app.deps.stores, site )
      .then( siteStore => require( '../src/api/form-api' )( site, siteStore ) )
      .then( formApi => formApi.create( req.user, req.body ) )
      .then( result => {
        if ( result.valid ) {
          res.redirect( '/cms/forms' )
        } else {
          const viewModel = getViewModel( req.user, req.session.currentSite, result.data )
          res.render( 'form-create', viewModel )
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
        const FormModel = require( '../src/view-models/form-model' )
        const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
        const site = req.session.currentSite

        siteApi.getStore( app.deps.stores, site )
          .then( siteStore => siteStore.getP( 'form' ) )
          .then( forms => {
            const formNames = forms.map( f => f.name )

            const dynamicSchema = {
              name: {
                not: {
                  enum: formNames
                }
              },
              email: {
                'default': req.user.email
              }
            }

            const formModel = FormModel( dynamicSchema )
            const form = formModel.form( formOptions )

            const viewModel = getViewModel( req.user, req.session.currentSite, form )

            res.render( 'form-create', viewModel )
          })
          .catch( err => {
            logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          })
      },
      post: defaultPost
    },
    register: {
      get: ( req, res ) => {
        const RegisterModel = require( '../src/view-models/register-model' )
        const siteApi = require( '../src/api/site-api' )( DbStore, app.deps, req.session )
        const site = req.session.currentSite
        const siteClaims = Array.isArray( site.claims ) ? site.claims : []

        let siteStore
        let pages
        let forms

        siteApi.getStore( app.deps.stores, site )
          .then( currentSiteStore => { siteStore = currentSiteStore })
          .then(() => siteStore.getP( 'form' ) )
          .then( allForms => {
            forms = allForms
          })
          .then(() => siteStore.getP( 'page' ) )
          .then( allPages => {
            pages = allPages
          })
          .then(() => {
            const formNames = forms.map( f => f.name )
            const pageRefs = pages.map( Reference )

            const editorClaims = siteClaims.map( claim => {
              return {
                name: claim,
                _id: utils.toIdentifier( claim ),
                icon: 'key'
              }
            })

            const dynamicSchema = {
              name: {
                not: {
                  enum: formNames
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

            const formModel = RegisterModel( dynamicSchema )
            const form = formModel.form( formOptions )

            const viewModel = getViewModel( req.user, site, form )

            res.render( 'form-create', viewModel )
          })
          .catch( err => {
            logger.error( err )
            const status = utils.httpStatus._500InternalServerError
            res.status( status.code )
            res.render( 'error', { status: status, message: err.message })
          })
      },
      post: defaultPost
    }
  }

  return {
    route: '/cms/forms/create/:formType?',

    requireClaims: ['createForm'],

    get: ( req, res ) => {
      const formType = req.params.formType

      if ( formType && formTypes[formType] ) {
        formTypes[formType].get( req, res )
        return
      }

      const items = [
        {
          url: '/cms/forms/create/email',
          title: 'Email Form',
          icon: 'envelope-o',
          requireClaims: ['createForm']
        },
        {
          url: '/cms/forms/create/register',
          title: 'Registration Form',
          icon: 'user-plus',
          requireClaims: ['createForm']
        }
      ]

      const libraryItems = claims.filterByClaims( items, req.user.claims )

      const viewModel = getFormTypesViewModel( req.user, req.session.currentSite, libraryItems )

      res.render( 'ui-home', viewModel )
    },

    post: ( req, res ) => {
      const formType = req.params.formType

      if ( formType && formTypes[formType] ) {
        formTypes[formType].post( req, res )
        return
      }

      const status = utils.httpStatus._404NotFound
      res.status( status.code )
      logger.error( status.toFormat( req.url ) )
      res.render( 'error', { status: status, message: req.url })
    }
  }
}
