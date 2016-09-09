'use strict'

function UiModel( site ){
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
      url: '/css/dragula.css'
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
    }
  ];

  this.headScripts = [
    {
      url: '/js/modernizr.js'
    }
  ];

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
      url: '/js/dragula.min.js'
    },
    {
      url: '/js/slick.min.js'
    },
    {
      url: '/js/cms.js'
    },
    {
      text: '$( document ).foundation();'
    }
  ];

  if( site ){
    this.site = site.name;
  }
};

module.exports = UiModel;
