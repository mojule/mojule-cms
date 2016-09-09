'use strict'

const claims = [
  {
    key: 'master',
    label: 'Master'
  },
  {
    key: 'createSite',
    label: 'Create Sites'
  },
  {
    key: 'editSite',
    label: 'Edit Sites'
  },
  {
    key: 'createUser',
    label: 'Create Users'
  },
  {
    key: 'editUser',
    label: 'Edit Users'
  },
  {
    key: 'createFile',
    label: 'Create Files'
  },    
  {
    key: 'editFile',
    label: 'Edit Files'
  },    
  {
    key: 'createPage',
    label: 'Create Pages'
  },    
  {
    key: 'editPage',
    label: 'Edit Pages'
  },
  {
    key: 'createTemplate',
    label: 'Create Templates'
  },
  {
    key: 'editTemplate',
    label: 'Edit Templates'
  },
  {
    key: 'createForm',
    label: 'Create Forms'
  },
  {
    key: 'editForm',
    label: 'Edit Forms'
  }
]

const getClaims = user => 
  user.claims.includes( 'master') ?
    claims :
    claims.filter( claim => 
      user.claims.includes( claim.key )
    )

const hasClaims = ( user, claims ) => {
  const userClaims = getClaims( user ).map( claim => claim.key )
  
  return claims.every( claim => userClaims.includes( claim ) )
}
    
const filterByClaims = ( arr, claims ) => 
  arr.filter( el => {
    if( !( 'requireClaims' in el ) ) return true
    
    return el.requireClaims.every( claim => 
      claims.includes( claim ) 
    )
  })    

const master = claims.map( claim => claim.key )

module.exports = {
  claims,
  getClaims,
  hasClaims,
  filterByClaims,
  master
}
