'use strict'

const xml = require( 'xml' )

const urlNode = url => ({
  url: [ { loc: url } ]
})

const siteMapXmlFromUrls = urls => {
  const xmlns = {
    'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation': 'http://www.sitemaps.org/schemas/sitemap/0.9' + '\n' + 'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd'
  }

  const xmlOptions = {
    stream: false,
    declaration: {
      standalone: false,
      encoding: 'UTF-8'
    }
  }

  const root = xml.element( { _attr: xmlns } )
  const stream = xml( { 'urlset': root }, xmlOptions )

  return new Promise( ( resolve, reject ) => {
    let xmlResult = ''

    stream.on( 'data', chunk => xmlResult += chunk )

    stream.on( 'error', reject )

    stream.on( 'close', () => resolve( xmlResult ) )

    urls.forEach( url => root.push( urlNode( url ) ) )

    root.close()
  })
}

module.exports = siteMapXmlFromUrls
