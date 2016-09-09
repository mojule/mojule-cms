'use strict'

const cheerio = require( 'cheerio' )

const templates = require( '../template-engine' )
const DbItem = require( '../db/db-item' )
const TemplateModel = require( '../view-models/template-model' )
const utils = require( '../utils/utils' )

const newTemplate = ( store, model, user ) => {
  const template = DbItem(
    Object.assign(
      model,
      {
        creator: user._id,
        children: [],
        values: {
          name: model.name
        }
      }
    ),
    'template'
  )

  return store.saveP( template )
}

const create = ( api, user, body ) => {
  const templateModel = TemplateModel()
  const newTemplate = templateModel.assemble( body )
  const validate = templateModel.validate( newTemplate )

  if( validate.errors.length > 0 ){
    const form = templateModel.form( {}, newTemplate )

    return Promise.resolve({
      valid: false,
      data: form
    })
  }

  return api.newTemplate( newTemplate, user )
    .then(
      template => Promise.resolve({
        valid: true,
        data: template
      })
    )
}

const edit = ( store, template, body ) => {
  const templateModel = TemplateModel()

  const formOptions = {
    action: '/cms/templates/' + template._id
  }

  const newTemplate = templateModel.assemble( body )

  const validate = templateModel.validate( newTemplate )

  if( validate.errors.length > 0 ){
    const form = templateModel.form( formOptions, newTemplate, validate.errors )

    return Promise.resolve({
      valid: false,
      data: form
    })
  }

  template.values.name = template.name = newTemplate.name
  template.tags = newTemplate.tags

  return store.saveP( template )
    .then(
      template => Promise.resolve({
        valid: true,
        data: template
      })
    )
}

const defaultMaster = ( api, site, store, user, session ) => {
  const model = {
    name: 'Master'
  }

  return templates.initP( './views', '.html' )
    .then(
      () => api.newTemplate( model, user )
    )
    .then(
      template => {
        const $ = cheerio.load( '' )
        const cTemplates = utils.cheerioTemplates( $, templates.templates )

        const persistence = require( '../../composer/server-persistence' )( site, store, session )
        const components = require( '../../composer/components' )( $, cTemplates, persistence )
        const componentApi = require( '../../composer/component-api' )( $, cTemplates, persistence, components )

        const headingBox = componentApi.createNode( 'box', 'template' )
        const heading = componentApi.createNode('heading', 'template')

        const nav = componentApi.createNode( 'navigation', 'template' )

        const box = componentApi.createNode('box', 'template')

        const footerBox = componentApi.createNode( 'box', 'template' )
        const footer = componentApi.createNode('paragraph', 'template')

        headingBox.values.boxType = 'header'
        headingBox.values.isLocked = true

        heading.values.html = site.name
        heading.values.isLocked = true

        nav.values.isLocked = true

        box.values.isLocked = false

        footerBox.values.boxType = 'footer'
        footerBox.values.isLocked = true

        footer.values.html = '© ' + site.name
        footer.values.isLocked = true

        headingBox.children.push( heading )
        headingBox.children.push(nav)

        footerBox.children.push( footer )

        template.children.push( headingBox )
        template.children.push( box )
        template.children.push( footerBox )

        return template
      }
    )
    .then(
      template => store.saveP( template )
    )
}

const Api = ( site, store, session ) => {
  const api = {
    newTemplate: ( model, user ) => newTemplate( store, model, user ),
    create: ( user, body ) => create( api, user, body ),
    edit: ( template, body ) => edit( store, template, body ),
    defaultMaster: user => defaultMaster( api, site, store, user, session )
  }

  return api
}

module.exports = Api
