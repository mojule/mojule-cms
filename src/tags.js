'use strict'

const entitiesToTags = entities => {
  return entities.reduce( ( tags, entity ) => {
    if( Array.isArray( entity.tags )){
      entity.tags.forEach( tag => {
        if ( tags.indexOf( tag ) === -1 && tag !== '' ) {
          tags.push( tag )
        }
      })
    }

    return tags
  }, [ 'All' ] ).sort( ( a, b ) => {
    if ( a === 'Trash' ) {
      return 1
    }

    if ( b === 'Trash' ) {
      return -1
    }

    if ( a < b ) {
      return -1
    }

    if ( a > b ) {
      return 1
    }

    return 0
  }).map( tag => {
    return {
      value: tag,
      selected: tag === 'All',
      isTrash: tag === 'Trash'
    }
  })
}

const isTrash = entity => Array.isArray( entity.tags ) && entity.tags.includes( 'Trash' )

const Api = () => {
  const api = {
    viewModels: entitiesToTags,
    isTrash: isTrash
  }

  return api
}

module.exports = Api
