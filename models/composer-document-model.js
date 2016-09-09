'use strict'

function ComposerDocumentModel( site, styleUrls ){
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
      url: '/css/composer.css'
    },    
    {
      url: '/css/composer-document.css'
    },
    {
      url: '/css/main.css'
    }
  ]
  
  styleUrls.forEach( url => model.headStyles.push({ url: url, isUser: true }) )
  
  this.headScripts = [
    {
      url: '/js/modernizr.js'
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
      url: '/js/undo.js'
    },
    {
      url: '/js/rangy-core.js'
    },
    {
      url: '/js/rangy-classapplier.js'
    },
    {
      url: '/js/ia.medium.js'
    },
    {
      text: '$( document ).foundation();\n\nfunction refreshFoundation(){$( document ).foundation();}\n\nwindow.IMedium = Medium;'
    }
  ]
  
  
  this.bodyData = {
    data: [
      {
        key: 'deselect'
      }
    ]
  }

  if( site ){
    this.site = site.name
  }    
}

module.exports = ComposerDocumentModel
