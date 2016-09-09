'use strict'

const UserApi = require( './api/user-api' )
const SiteApi = require( './api/site-api' )
const PageRenderModel = require( '../models/page-render-model' )
const DbStore = require( './db-store' )

const renderComponents = ( app, components, req, res ) => {
  const templates = app[ 'template-engine' ].templates
  const site = req.session.currentSite
  const siteApi = SiteApi( DbStore, app.deps, req.session )

  let styles
  let siteStore

  return siteApi.getStyles( app.deps.stores, site )
    .then(
      siteStyles => {
        styles = siteStyles
      }
    )
    .then(
      () => siteApi.getStore( app.deps.stores, site )
    )
    .then(
      store => {
        siteStore = store
      }
    )
    .then(
      () => {
        const pageApi = require( './api/page-api' )( site, siteStore, req.session )

        return pageApi.renderMaster( components, templates )
      }
    )
    .then(
      html => {
        const model = new PageRenderModel( html, site, styles )

        const plugins = app.plugins.filter( p => p.site === site.name )
        const pluginUrls = plugins.map( p => '/plugins/' + p.site + '/' + p.name )

        pluginUrls.forEach( url => model.scripts.push( { url } ) )

        return model
      }
    )
}

module.exports = renderComponents
