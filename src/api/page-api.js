'use strict'

const path = require( 'path' )
const fs = require( 'fs' )
const pify = require( 'pify' )
const cheerio = require( 'cheerio' )

const DbItem = require( '../db/db-item' )
const Reference = require( '../form-models/reference' )
const PageModel = require( '../view-models/page-model' )
const utils = require( '../utils/utils' )
const Tree = require( '../tree' )
const readFile = pify( fs.readFile )
const writeFile = pify( fs.writeFile )
const mkdir = pify( fs.mkdir )

const queryToString = query =>
  Object.keys( query )
    .map( key =>
      [ key, query[ key ] ].join( '-' )
    )
    .join( '_' )

const siteCachePath = siteId => path.join( 'cache', siteId )

const getCacheName = ( siteId, pageId, query, userOptions ) => {
  const cachePath = siteCachePath( siteId )
  const queryString = queryToString( query )
  let filename = pageId

  if( queryString.length > 0 ){
    filename += '_' + queryString
  }

  if( userOptions ){
    filename += '_' + userOptions.id
  }

  filename += '.html'

  return path.join( cachePath, filename )
}

const saveToCache = ( site, page, query, html ) =>
  new Promise(
    resolve => {
      const cachePath = siteCachePath( site._id )
      const filePath = getCacheName( site._id, page._id, query )

      fs.exists( cachePath, exists => {
        if( exists ){
          resolve(
            writeFile( filePath, html, 'utf8' )
              .then(
                () => html
              )
          )
        } else {
          resolve(
            mkdir( cachePath )
              .then(
                () => writeFile( filePath, html, 'utf8' )
              )
              .then(
                () => html
              )
          )
        }
      })
    }
  )

const newPage = ( site, store, model, user ) => {
  const page = Object.assign({
    key: 'page',
    creator: user._id,
    slug: utils.toIdentifier( model.name ),
    documents: [],
    order: 0
  }, model )

  const block = {
    key: 'block',
    children: [],
    values: {
      name: 'Master',
      templateId: site.master
    }
  }

  const doc = {
    key: 'document',
    children: [ block ],
    values: {}
  }

  return store.loadP( site.master )
    .then(
      template => {
        block.children = template.children.slice()

        block.children.forEach( child => {
          Tree( child ).walk( node => {
            node._templateId = node._id;
            node._id = utils.randomId( node.key )
            node.values.fromTemplate = true;
          });
        });
      }
    )
    .then(
      () => store.saveP( doc )
    )
    .then(
      doc => {
        page.document = doc._id
        page.documents.push( doc._id )

        return page
      }
    )
    .then(
      page =>
        store.saveP( page )
    )
}

const create = ( api, site, store, user, body ) =>
  store.getP( 'page' )
    .then(
      pages => {
        const parentPages = pages.map( Reference )
        const pageNames = pages.map( p => p.name )
        const pageSlugs = pages.map( p => p.slug )

        const customClaims = Array.isArray( site.claims ) ?
          site.claims.map(
            claim =>
              Reference({
                name: claim,
                _id: utils.toIdentifier( claim )
              })
          ) :
          []

        body[ 'page.slug' ] = utils.toIdentifier( body[ 'page.name' ] )

        const dynamicSchema = {
          name: {
            not: {
              enum: pageNames
            }
          },
          slug: {
            not: {
              enum: pageSlugs
            }
          },
          requireClaims: {
            items: {
              enum: customClaims
            }
          },
          parent: {
            enum: parentPages
          }
        }

        const pageModel = PageModel( dynamicSchema )

        const page = pageModel.assemble( body )

        const validate = pageModel.validate( page )

        if( validate.errors.length > 0 ){
          const form = pageModel.form( {}, page, validate.errors )

          return Promise.resolve({
            valid: false,
            data: form
          })
        } else {
          return api.newPage( page, user )
            .then(
              page => Promise.resolve({
                valid: true,
                data: page
              })
            )
        }
      }
    )

const edit = ( site, store, page, body ) => {
  let stylesheets

  return store.getP( 'file' )
    .then(
      files => {
        stylesheets = files.filter(
          f => f.mimetype === 'text/css'
        )

        return stylesheets
      }
    )
    .then(
      () => store.getP( 'page' )
    )
    .then(
      pages => {
        const id = page._id

        const parentPages = pages.map( p => {
          const reference = Reference( p )

          if( page.parent ){
            let id
            if( typeof page.parent === 'string' ){
              id = page.parent
            } else {
              id = page.parent._id
            }

            reference.selected = p._id === id
          }

          return reference
        })

        const pageNames = pages.filter(
          p => p._id !== id
        ).map(
          p => p.name
        )

        const pageSlugs = pages.filter(
          p => p._id !== id
        ).map(
          p => p.slug
        )

        const stylesheetRefs = stylesheets.map( s => {
          return {
            _id: s._id,
            name: s.originalname
          }
        })

        const customClaims = Array.isArray( site.claims ) ?
          site.claims.map(
            claim =>
              Reference({
                name: claim,
                _id: utils.toIdentifier( claim )
              })
          ) :
          []

        const dynamicSchema = {
          name: {
            not: {
              enum: pageNames
            }
          },
          slug: {
            not: {
              enum: pageSlugs
            }
          },
          stylesheets: {
            items: {
              enum: stylesheetRefs
            }
          },
          requireClaims: {
            items: {
              enum: customClaims
            }
          },
          parent: {
            enum: parentPages
          }
        }

        const pageModel = PageModel( dynamicSchema )

        const newPage = pageModel.assemble( body )

        if( page.name === 'Home' ){
          newPage.parent = {
            _id: page._id,
            name: 'Home'
          }
        }

        const validate = pageModel.validate( newPage )

        if( validate.errors.length > 0 ){
          const formOptions = {
            action: '/cms/pages/' + id
          }

          if( page.name === 'Home' ){
            dynamicSchema.name.format = 'hidden'
            dynamicSchema.slug.format = 'hidden'

            dynamicSchema.parent.format = 'hidden'
            dynamicSchema.parent.$ref = null
            dynamicSchema.parent.type = 'string'
            delete dynamicSchema.parent.enum
          }

          const pageModel = PageModel( dynamicSchema )

          const form = pageModel.form( formOptions, newPage, validate.errors )

          return Promise.resolve({
            valid: false,
            data: form
          })
        } else {
          if( page.name !== 'Home' ){
            page.name = newPage.name
            page.parent = newPage.parent
            page.slug = newPage.slug
          }

          page.stylesheets = newPage.stylesheets
          page.order = newPage.order
          page.excludeFromNavigation = newPage.excludeFromNavigation
          page.requireClaims = newPage.requireClaims
          page.tags = newPage.tags

          return Promise.resolve({
            valid: true,
            data: page
          })
        }
      }
    )
    .then(
      result => {
        if( result.valid ){
          return store.saveP( result.data )
            .then(
              () => result
            )
        } else {
          return Promise.resolve( result )
        }
      }
    )
}

const getRoute = ( api, site, store, page ) => {
  if( page._id === site.homePage ){
    return Promise.resolve( '/' )
  }

  let id
  if( typeof page.parent === 'string' ){
    id = page.parent
  } else {
    id = page.parent._id
  }

  return store.loadP( id )
    .then(
      parent =>
        api.getRoute( parent )
    )
    .then(
      parentRoute =>
        Promise.resolve( parentRoute + page.slug + '/' )
    )
}

const fromSlugs = ( site, store, path, home ) => {
  const slugs = path.split( '/' ).filter( slug => slug !== '' )

  return store.getP( 'page' )
    .then(
      pages => {
        let current = home

        slugs.forEach( slug => {
          const page = pages.find(
            p => {
              let id
              if( p.parent ){
                if( typeof p.parent === 'string' ){
                  id = p.parent
                } else {
                  id = p.parent._id
                }
              }
              return p.slug === slug && id === current._id
            }
          )

          if( page ){
            current = page
          } else {
            const err = Error( 'Page not found - path was ' + path )

            err.status = 404

            throw err
          }
        })

        return Promise.resolve( current )
      }
    )
}

const getPage = ( site, store, path ) =>
  store.loadP( site.homePage )
    .then(
      home => {
        if( path === '/' ){
          return Promise.resolve( home )
        } else {
          return fromSlugs( site, store, path, home )
        }
      }
    )

const getStyleFiles = ( store, api, page ) => {
  if( !page.stylesheets || page.stylesheets.length === 0 ){
    return Promise.resolve( [] )
  }

  const fileApi =  require( './file-api' )( store )

  return Promise.all(
    page.stylesheets.map( sheet => {
      let id
      if( typeof sheet === 'string' ){
        id = sheet
      } else {
        id = sheet._id
      }

      return store.loadP( id )
    })
  )
}

const getStyles = ( store, api, page ) => {
  if( !page.stylesheets || page.stylesheets.length === 0 ){
    return Promise.resolve( [] )
  }

  const fileApi =  require( './file-api' )( store )

  return getStyleFiles( store, api, page )
    .then(
      files => Promise.all( files.map( fileApi.getUrl ) )
    )
}

const pageLinkMap = ( api, store ) =>
  store.getP( 'page' )
    .then(
      pages =>
        Promise.all(
          pages.map(
            p =>
              api.getRoute( p )
                .then( route => Promise.resolve({ _id: p._id, route }))
          )
        )
    )
    .then(
      routes =>
        Promise.resolve(
          routes.reduce( ( map, routeData ) => {
            map[ routeData._id ] = routeData.route
            return map
          }, {} )
        )
    )

const getHome = ( site, store ) =>
  store.loadP( site.homePage )

const getPath = ( site, store, page ) => {
  const append = ( path, page ) => {
    path.push( page )

    if( page._id === site.homePage ){
      return Promise.resolve( path )
    }

    let id
    if( typeof page.parent === 'string' ){
      id = page.parent
    } else {
      id = page.parent._id
    }

    return store.loadP( id )
      .then(
        parent => append( path, parent )
      )
  }

  return append( [], page )
    .then(
      path => {
        path.reverse()
        return Promise.resolve( path )
      }
    )
}

const getChildPages = ( store, page ) =>
  store.getP( 'page' )
    .then(
      pages =>
        Promise.resolve(
          pages.filter(
            p => {
              let id
              if( p.parent ){
                if( typeof p.parent === 'string'){
                  id = p.parent
                } else {
                  id = p.parent._id
                }
              }
              return id === page._id
            }
          )
        )
    )

const isTopLevel = ( api, page ) =>
  api.getHome()
    .then(
      home => {
        let id
        if( page.parent ){
          if( typeof page.parent === 'string'){
            id = page.parent
          } else {
            id = page.parent._id
          }
        }
        const isTopLevel = page._id === home._id || id === home._id
        return Promise.resolve( isTopLevel )
      }
    )

const getTree = ( api, store ) =>
  store.getP( 'page' )
    .then(
      pages => {
        const addChildren = page => {
          const children = pages.filter(
            p => {
              let id
              if( p.parent ){
                if( typeof p.parent === 'string'){
                  id = p.parent
                } else {
                  id = p.parent._id
                }
              }

              return id === page._id
            }
          )

          children.forEach( addChildren )

          page.children = children
        }

        return api.getHome()
          .then(
            home => {
              addChildren( home )
              return Promise.resolve( home )
            }
          )
      }
    )

const replaceLinks = ( api, store, $ ) =>
  api.pageLinkMap()
    .then(
      pageMap => {
        const $wrapLinks = $( '[data-link]' )

        /*
        You shouldn't put a link inside a link!

        perfectionist approach would be to traverse all children
        and remove/disable any that are interactive

        https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Interactive_content
        */
        $wrapLinks.each( ( i, el ) => {
          const href = $( el ).attr( 'data-link' )
          const $link = $( '<a></a>' )
          $link.attr( 'href', href )

          $( el ).wrap( $link )

          $( el ).removeAttr( 'data-link' )
        })

        const $pageLinks = $( 'a[href^="page-"]' )
        const $fileLinks = $( 'a[href^="file-"]' )
        const $imgLinks = $( 'img[src^="/files/file-"]' )

        //this is for the responsive image functionality
        if( $imgLinks.length > 0 ){
          $imgLinks.each( ( i, el ) => {
            var src = $( el ).attr( 'src' )

            src = src.replace( /\/1024\//g, '/64/' )

            $( el ).attr( 'src', src )
          })
        }

        if( $pageLinks.length > 0 ){
          $pageLinks.each( ( i, el ) => {
            const id = $( el ).attr( 'href' )
            const route = pageMap[ id ]
            $( el ).attr( 'href', route )
          })
        }

        if( $fileLinks.length === 0 ){
          return Promise.resolve( $ )
        } else {
          const fileApi = require( './file-api' )( store )

          return store.getP( 'file' )
            .then(
              files => {
                $fileLinks.each( ( i, el ) => {
                  const id = $( el ).attr( 'href' )
                  const file = files.find( f => f._id === id )
                  if( file ){
                    const route = fileApi.getUrl( file )
                    $( el ).attr( 'href', route )
                  }
                })

                return Promise.resolve( $ )
              }
            )
        }
      }
    )

const render = ( api, site, page, templates, query, userOptions ) =>
  new Promise(
    ( resolve, reject ) => {
      const cachePath = getCacheName( site._id, page._id, query, userOptions )

      fs.exists( cachePath, exists => {
        if( exists ){
          resolve( readFile( cachePath, 'utf8' ) )
        } else {
          resolve( api.renderDocument( page, templates, query, userOptions ) )
        }
      })
    }
  )

const getGraphMap = ( api, store ) => {
  let map = []

  return store.getP( 'page' )
    .then(
      pages => {
        pages = pages.filter( p => !p.excludeFromNavigation )

        const addChildren = ( page, depth ) => {
          const node = {
            id: page._id,
            depth: depth,
            name: page.name,
            page: page,
            children: []
          }

          if( page.parent ){
            let id

            if( typeof page.parent === 'string'){
              id = page.parent
            } else {
              id = page.parent._id
            }

            node.parent = id
          }

          map.push( node )

          const children = pages.filter(
            p => {
              let id
              if( p.parent ){
                if( typeof p.parent === 'string'){
                  id = p.parent
                } else {
                  id = p.parent._id
                }
              }

              return id === page._id
            }
          )

          children.forEach( p => {
            node.children.push( p._id )
            addChildren( p, depth + 1 )
          })
        }

        return api.getHome()
          .then(
            home => {
              addChildren( home, 0 )

              return Promise.resolve(
                map.sort(
                  ( a, b ) => {
                    return new Date( a.page._created ).getTime() - new Date( b.page._created ).getTime()
                  }
                ).sort(
                  ( a, b ) => {
                    return ( a.page.order || 0 ) - ( b.page.order || 0 )
                  }
                )
              )
            }
          )
      }
    )
}

const treeToTemplate = api => {
  let map

  return api.getGraphMap()
    .then(
      templateMap => {
        map = templateMap

        return Promise.all(
          templateMap.map(
            node => {
              return api.getRoute( node.page )
                .then(
                  route => node.route = route
                )
            }
          )
        )
      }
    )
    .then(
      () => {
        const counts = map.reduce( ( counts, node ) => {
          if( typeof counts[ node.depth ] !== 'number' ){
            counts[ node.depth ] = 0
          }

          counts[ node.depth ]++

          return counts
        }, {})

        const count = ( counts[ 0 ] || 0 ) + ( counts[ 1 ] || 0 )

        const homeNode = map.find( node => node.depth === 0 )

        const templateTree = {
          count: count,
          children: []
        }

        templateTree.children.push({
          name: homeNode.name,
          url: homeNode.route,
          top: true,
          count: false,
          leaf: true
        })

        const topLevelNodes = map.filter( node => node.depth === 1 )

        const addChildren = ( node, templateNode ) => {
          templateNode.children = []

          node.children.forEach( id => {
            const childNode = map.find( node => node.id === id )

            const childTemplateNode = {
              name: childNode.name,
              url: childNode.route,
              top: false,
              count: false,
              leaf: childNode.children.length === 0
            }

            templateNode.children.push( childTemplateNode )

            if( !childTemplateNode.leaf ){
              addChildren( childNode, childTemplateNode )
            }
          })
        }

        topLevelNodes.forEach( node => {
          const templateNode = {
            name: node.name,
            url: node.route,
            top: true,
            count: false,
            leaf: node.children.length === 0
          }

          templateTree.children.push( templateNode )

          if( !templateNode.leaf ){
            addChildren( node, templateNode )
          }
        })

        return Promise.resolve( templateTree )
      }
    )
}

const renderComponent = ( api, site, store, component, componentOptions, templates, session ) => {
  const ComponentApi = require( '../../composer/component-api' )
  const persistence = require( '../../composer/server-persistence' )( site, store, session )
  const $ = cheerio.load( '' )

  const cTemplates = utils.cheerioTemplates( $, templates )

  let components
  let componentApi
  let restoreTemplates

  const cleanAttrNames = [ 'container', 'root', 'component', 'text', 'node' ]

  return treeToTemplate( api )
    .then(
      templateData => {
        componentOptions.sitemapData = templateData

        components = require( '../../composer/components' )( $, cTemplates, persistence, componentOptions )
        componentApi = ComponentApi( $, cTemplates, persistence, components, componentOptions )
        restoreTemplates = require( '../../composer/block-processor' )( persistence )
      }
    )
    .then(
      () =>
        new Promise(
          resolve => {
            restoreTemplates( component, () => {
              componentApi.toEl( component, false, $el => {
                $.root().append( $el )

                cleanAttrNames.forEach( name =>
                  $( '*' ).removeAttr( 'data-' + name )
                )

                resolve(
                  replaceLinks( api, store, $ )
                    .then(
                      $ => $.html()
                    )
                )
            })
          })
        }
      )
    )
}

const renderDocument = ( api, site, store, page, templates, query, session, userOptions ) => {
  const componentOptions = {
    page: page._id,
    query: query,
    isRenderMode: true
  }

  if( userOptions ){
    componentOptions.user = userOptions
  }

  return store.loadP( page.document )
    .then(
      document => renderComponent( api, site, store, document, componentOptions, templates, session )
    )
    .then(
      html => saveToCache( site, page, query, html )
    )
}

const renderMaster = ( api, site, store, components, templates ) => {
  return store.loadP( site.master )
    .then(
      template => {
        const master = DbItem({
          children: template.children.slice(),
          values: {
            templateId: template._id
          }
        }, 'block')

        let container

        master.children.forEach( child => {
          utils.walk( child, n => {
            n._templateId = n._id
            n._id = utils.randomId( n.key )
            n.values.fromTemplate = true

            if( !container ){
              const isContainer = n.key === 'box' && !n.values.isLocked

              if( isContainer ){
                container = n
              }
            }
          })
        })

        container.children = container.children.concat( components )

        return master
      }
    )
    .then(
      master => api.renderComponent( master, templates )
    )
}

const Api = ( site, store, session ) => {
  const componentOptions = {
    isRenderMode: true
  }

  const api = {
    newPage: ( model, user ) => newPage( site, store, model, user ),
    create: ( user, body ) => create( api, site, store, user, body ),
    edit: ( page, body ) => edit( site, store, page, body ),
    getRoute: page => getRoute( api, site, store, page ),
    getPage: path => getPage( site, store, path ),
    getStyles: page => getStyles( store, api, page ),
    getStyleFiles: page => getStyleFiles( store, api, page ),
    pageLinkMap: () => pageLinkMap( api, store ),
    getHome: () => getHome( site, store ),
    getPath: page => getPath( site, store, page ),
    getChildPages: page => getChildPages( store, page ),
    isTopLevel: page => isTopLevel( api, page ),
    getTree: () => getTree( api, store ),
    getGraphMap: () => getGraphMap( api, store ),
    render: ( page, templates, query, userOptions ) => render( api, site, page, templates, query, userOptions ),
    renderDocument: ( page, templates, query, userOptions ) => renderDocument( api, site, store, page, templates, query, session, userOptions ),
    renderComponent: ( component, templates ) => renderComponent( api, site, store, component, componentOptions, templates, session ),
    renderMaster: ( components, templates ) => renderMaster( api, site, store, components, templates )
  }

  return api
}

module.exports = Api