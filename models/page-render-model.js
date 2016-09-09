'use strict'

function PageRenderModel( html, site, styleUrls ){
  const model = this
  
  this.headStyles = [
    {
      url: '/css/foundation.css'
    },
    {
      url: '//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css'
    },
    {
      url: '//fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic'
    },
    {
      url: '/css/slick.css'
    },
    {
      url: '/css/slick-theme.css'
    },
    {
      url: '/css/main.css'
    }
  ]
  
  styleUrls.forEach( url => model.headStyles.push({ url: url, isUser: true }) )
  
  this.headScripts = [
    {
      url: '/js/modernizr.js'
    },
    {
      url: 'https://www.google.com/recaptcha/api.js'
    }
  ]
  
  this.scripts = [
    {
      url: '/js/jquery-2.1.4.js'
    },
    {
      url: '/js/foundation.min.js'
    },
    {
      url: '/js/slick.min.js'
    },
    {
      text: '$( document ).foundation();'
    },
    {
      url: '/js/main.js'
    }
  ]

  this.html = html
  
  if( site ){
    this.site = site.name
  }    
}

module.exports = PageRenderModel
