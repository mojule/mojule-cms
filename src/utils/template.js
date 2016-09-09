//duck type for function
const isFunction = obj => 
  !!(obj && obj.constructor && obj.call && obj.apply)

const cheerioTemplates = ( $, templates ) => {
  const cTemplates = {}
  Object.keys( templates ).forEach( name => {
    const fn = templates[ name ]
    if( isFunction( fn ) ){      
      cTemplates[ name ] = model => {
        const html = fn( model )
        return $( html )
      }
    }      
  })  
  
  return cTemplates
} 

module.exports = {
  cheerioTemplates
}