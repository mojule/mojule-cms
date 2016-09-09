'use strict'

function ComposerModel( options, styleUrls ){
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
      url: '/css/cms.css'
    },
    {
      url: '/css/ui-header.css'
    },
    {
      url: '/css/composer.css'
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

  var consts = {
    id: options.id,
    type: options.type,
    user: options.user,
    restrict: options.restrict,
    toolbarComponents: options.toolbarComponents
  }

  if( options.page ){
    consts.page = options.page
    this.page = options.page
  }

  const constScript = 'window.consts = ' + JSON.stringify( consts ) + ';'

  this.scripts = [
    {
      url: '/js/jquery-2.1.4.js'
    },
    {
      url: '/js/foundation.min.js'
    },
    {
      url: '/js/ICanHaz.min.js'
    },
    {
      url: '/js/slick.min.js'
    },
    {
      url: '/js/jquery.insertAt.js'
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
      url: '/js/scroller.js'
    },
    {
      text: constScript
    },
    {
      url: '/js/cms.js'
    },
    {
      text: '$(document).foundation();'
    }
  ]

  this.bodyData = {
    data: [
      {
        key: 'deselect'
      }
    ]
  }

  this.type = options.type

  if( options.site ){
    this.site = options.site.name
  }
}

module.exports = ComposerModel
