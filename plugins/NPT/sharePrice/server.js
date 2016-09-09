'use strict'

const http = require( 'http' )

const getSharePrice = data => new Promise(
  ( resolve, reject ) => {
    const url = 'http://finance.yahoo.com/webservice/v1/symbols/' + data.symbol + '/quote?format=json'
    
    http.get( url, res => {
      let body = ''

      res.on( 'data', chunk => {
        body += chunk;
      })

      res.on( 'end', () => {
        const response = JSON.parse( body )
        
        const price = parseFloat( response.list.resources[ 0 ].resource.fields.price ).toFixed( 2 )
        
        data.price = price
        data.lastChecked = ( new Date() ).toJSON()
        
        resolve( data )
      })   
    }).on( 'error', err => {
      reject( err )
    })
  }
)

const plugin = data => new Promise(
  ( resolve, reject ) => {
    let isFetch = true
    
    if( data.price && data.lastChecked ){
      const now = new Date()
      const last = new Date( data.lastChecked )
      
      //convert minutes to ms
      const expiryMs = data.expiry * 60000
      
      isFetch = ( now - last > expiryMs )
    }
    
    if( isFetch ){
      resolve( getSharePrice( data ) )
    } else {
      resolve( data )
    }
  }
)

module.exports = plugin