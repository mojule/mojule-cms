'use strict'
/**
 * @module - Santized store database access for front end.
 */
const path = require( 'path' )
const Configurator = require( '../configurator' )
const configurator = Configurator( path.join( process.cwd(), 'configuration.json' ) )
const tagsApi = require( '../tags' )()

const imageApi = require( './image-api' )()

const whitelists = {
  get: [ 'image', 'page', 'file', 'template', 'form' ],
  load: [ 'page', 'document', 'template', 'form' ],
  save: [ 'document', 'template', 'form' ]
}

/**
 * @const baseTypes - maps high level cms types to underlying store (database) types.
 */
const baseTypes = {
  image: 'file',
  page: 'page',
  file: 'file',
  form: 'form'
}

const Translators = ( api, site, store, session ) => {
  const fileApi = require( './file-api' )( store )

  const filters = {
    file: {
      image: file => Promise.resolve( imageApi.isImage( file ) && !fileApi.isTrash( file ) ),
      file: file => Promise.resolve( !fileApi.isTrash( file ) )
    },
    page: {
      page: page => Promise.resolve( !tagsApi.isTrash( page ) )
    },
    form: {
      form: form => Promise.resolve( !tagsApi.isTrash( form ) )
    },
    template: {
      template: template => Promise.resolve( !tagsApi.isTrash( template ) )
    }
  }

  const mappers = {
    file: {
      file: file => Promise.resolve({
        id: file._id,
        title: file.originalname,
        url: fileApi.getUrl( file ),
        icon: fileApi.getIcon( file ),
        tags: fileApi.getTags( file ),
        data: [
          {
            key: 'tags',
            value: fileApi.getTags( file ).join( ' ' )
          }
        ]
      }),

      image: file => {
        const src = imageApi.getUrl( file, {
          strategy: 'fitToWidth',
          width: 1024
        })

        const thumbSize = Math.ceil( 1024 / 6 )

        const thumbSrc = imageApi.getUrl( file, {
          strategy: 'fitToRect',
          width: thumbSize,
          height: thumbSize
        })

        const tags = fileApi.getTags( file )

        const image = {
          title: file.originalname,
          alt: file.originalname,
          image: thumbSrc,
          tags,
          data: [
            {
              key: 'src',
              value: src
            },
            {
              key: 'id',
              value: file._id
            },
            {
              key: 'image'
            },
            {
              key: 'tags',
              value: tags.join( ' ' )
            }
          ],
          width: file.width,
          height: file.height
        }

        return Promise.resolve( image )
      }
    },

    template: {
      template: template => {
        template.tags = Array.isArray( template.tags ) ? template.tags : []

        template.data = [
          {
            key: 'tags',
            value: template.tags.join( ' ' )
          }
        ]

        return Promise.resolve( template )
      }
    },

    page: {
      page: page => {
        const pageApi = require( './page-api' )( site, store, session )

        const tags = Array.isArray( page.tags ) ? page.tags : []

        const result = {
          id: page._id,
          title: page.name,
          document: page.document,
          excludeFromNavigation: page.excludeFromNavigation || false,
          isHome: page._id === site.homePage,
          created: page._created,
          published: page._published,
          tags,
          order: page.order || 0,
          data: [
            {
              key: 'tags',
              value: tags.join( ' ' )
            }
          ]
        }

        return pageApi.isTopLevel( page )
          .then(
            isTop => {
              result.isTop = isTop
            }
          )
          .then(
            () => pageApi.getRoute( page )
          )
          .then(
            route => {
              result.url = route
            }
          )
          .then(
            () => pageApi.getChildPages( page )
          )
          .then(
            children => {
              result.children = children.map( p => p._id )
            }
          )
          .then(
            () => pageApi.getPath( page )
          )
          .then(
            path => {
              result.path = path.map( p => p._id )
            }
          )
          .then(
            () => result
          )
      }
    },

    form: {
      form: form => {
        const formApi = require( './form-api' )( site, store )
        const pageApi = require( './page-api' )( site, store, session )

        const viewModel = formApi.viewModel( form )

        form.values.name = form.name
        form.values.submit = form.submitText

        form.tags = Array.isArray( form.tags ) ? form.tags : []

        form.data = [
          {
            key: 'tags',
            value: form.tags.join( ' ' )
          },
          {
            key: 'id',
            value: form._id
          }
        ]

        const formOptions = {
          action: '/cms/action/' + form._id,
          submitLabel: form.submitText
        }

        if( session[ form._id ] ){
          const result = session[ form._id ]

          if( result.valid ){
            form.values.form = viewModel.form( formOptions )
            form.values.form.successMessage = form.successMessage
          } else {
            form.values.form = viewModel.form( formOptions, result.data.body, result.data.errors )
          }

          delete session[ form._id ]
        } else {
          form.values.form = viewModel.form( formOptions )
        }

        if( form.useCaptcha ){
          form.values.form.captcha = configurator.recaptcha().sitekey
        }

        const result = () =>
          Object.assign( {
            template: 'composerForm'
          }, form )

        if( form.formType === 'register' && typeof form.values.form.successMessage === 'string' ){
          return store.loadP( form.loginPage._id )
            .then(
              pageApi.getRoute
            )
            .then(
              route => {
                form.values.form.successMessage += ' <br /><a href="' + route + '">You can log in here</a>'
              }
            )
            .then(
              result
            )
        }

        return Promise.resolve( result() )
      }
    }
  }

  return {
    filters, mappers
  }
}

/**
 * @function tryFilter
 * @returns - If there is a filter defined for any item type passed then returns the filtered items else returns the passed items (i.e. has no effect)
 * @param filters - Map instance
 * @param from - maps frontend type to store type {@link from}
 * @param to - frontend type returned {@link to}
 */
const tryFilter = ( filters, items, from, to ) => {
  if( Object.keys( filters ).includes( from ) && Object.keys( filters[ from ] ).includes( to ) ){
    return Promise.all(
      items.map( item => filters[ from ][ to ]( item ) )
    )
    .then(
      bools =>
        Promise.resolve( items.filter( ( item, i ) => bools[ i ]))
    )
  } else {
    return Promise.resolve( items )
  }
}

const tryMapper = ( mappers, items, from, to ) => {
  if( Object.keys( mappers ).includes( from ) && Object.keys( mappers[ from ] ).includes( to ) ){
    return Promise.all( items.map( item => mappers[ from ][ to ]( item ) ) )
  } else {
    return Promise.resolve( items )
  }
}

/**
 * @function get
 * @returns - promise contains an array of items in db matching key, potentially filtered/mapped.
 * - whitelist = allowed db keys. Filter
 * - map i.e. "file" does not return files but maps to object with properties useful to the front end
 * @param api - site api instance.
 * @param site - site instance
 * @param store - site store
 * @param {string} key  -  store key (store type e.g. "image")
 */
const get = ( api, site, store, session, key ) => {
  if( !whitelists.get.includes( key ) ){
    return Promise.resolve( [] )
  }

  const translators = Translators( api, site, store, session )

  /**
   * @function from - - maps from front end type to a backend type, if required. i.e. image maps to file.
   */
  const from = Object.keys( baseTypes ).includes( key ) ?
    baseTypes[ key ] :
    key

  /**
   * @const to - the frontend type to return.  Unlike from which must check if there is a basetype for the frontend type to will always match the key passed.
   */
  const to = key

  return store.getP( from )
    .then(
      items => {
        return tryFilter( translators.filters, items, from, to )
      }
    )
    .then(
      items => {
        return tryMapper( translators.mappers, items, from, to )
      }
    )
}

const filterMapSingle = ( api, site, store, session, item ) => {
  const translators = Translators( api, site, store, session )
  const key = item.key

  const from = Object.keys( baseTypes ).includes( key ) ?
    baseTypes[ key ] :
    key

  const to = key

  const items = [ item ]

  return tryFilter( translators.filters, items, from, to )
    .then(
      items => {
        return tryMapper( translators.mappers, items, from, to )
      }
    )
    .then(
      items => items.length === 1 ? Promise.resolve( items[ 0 ] ) : Promise.resolve( [] )
    )
}

/**
 * @function load -
 * @returns - if an item with the id exists and the item type (key) is in the whitelist then returns a promise resolving to the item else returns promise resolving to not found error.
 * @param store - instance of cms store
 * @param id -  unique id of required item
 */
const load = ( api, site, store, session, id ) => {
  if( id + '' === '-1'){
    return Promise.resolve({children:[]})
  }

  return store.loadP( id )
    .then(
      item => {
        if( whitelists.load.includes( item.key )){
          return filterMapSingle( api, site, store, session, item )
        } else {
          return Promise.reject( new Error( item.key + ' not found' ) )
        }
      }
    )
}

/**
 * @function save -
 * @returns - passed item augmented with new properties (e.g. _id )if those properties not already present..
 * @param store - instance of cms store
 * @param item - item to save
 */
const save = ( store, item ) => {
  //everything after the first && is a guard to ensure that someone isn't trying to overwrite
  //for example a user by saving an object with key:document but id user_...
  if( whitelists.save.includes( item.key ) && item._id && item._id.indexOf( item.key ) === 0 ){
    return store.saveP( item )
  } else {
    return Promise.reject( new Error( item.key + ' not found' ) )
  }
}

/**
 * @function Api
 * @param api - site api instance.
 * @param store - instance of cms store
 * @returns - instance of the Store API
 */
const Api = ( site, store, session ) => {
  const api = {
    get: key => get( api, site, store, session, key ),
    load: id => load( api, site, store, session, id ),
    save: obj => save( store, obj )
  }

  return api
}

module.exports = Api
