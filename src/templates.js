'use strict'

const fs = require( 'fs' );
var path = require( 'path' );
var hogan = require( 'hogan.js' );
var async = require( 'async' );

function Template( name, str ){
  this.name = name;
  this.template = str.replace( /^\uFEFF/, '' );
  this.compiled = hogan.compile( this.template );
}

Template.load = function( templatePath, callback ){
  var file = path.parse( templatePath );
  
  fs.readFile( templatePath, 'utf8', function( err, str ){
    if( err ){
      callback( err );
      return;
    }
    
    callback( null, new Template( file.name, str ) );
  });    
};

function Templates( extname ){
  this.extname = extname;
  this.dictionary = {};
}

Templates.Template = Template;

Templates.prototype.compiled = function(){
  var dictionary = this.dictionary;
  var keys = Object.keys( dictionary );
  
  return keys.reduce( function( compiled, key ){
    compiled[ key ] = dictionary[ key ].compiled;
    return compiled;
  }, {});
}

Templates.prototype.add = function( template ){
  var templates = this;
  var dictionary = this.dictionary;
  
  dictionary[ template.name ] = template;
  
  var keys = Object.keys( dictionary );
  var compiled = templates.compiled();
  
  keys.forEach( function( key ){
    templates[ key ] = function( values ){
      return compiled[ key ].render( values, compiled );
    };
  });
}

Templates.prototype.load = function( templatesPath, callback ){
  var templates = this;
  
  fs.readdir( templatesPath, function( err, filePaths ){
    if( err ){ 
      callback( err );
      return;
    }
    
    filePaths = filePaths.filter( function( file ){
      return path.extname( file ) === templates.extname;
    });
    
    async.each( filePaths, function( filePath, next ){
      var templatePath = path.join( templatesPath, filePath );
      
      Template.load( templatePath, function( err, template ){
        if( err ){
          next( err );
        }
        templates.add( template );
        next();
      });
    }, function( err ){
      if( err ){
        callback( err );
        return;
      }
      
      callback( null );
    });
  });   
}

module.exports = Templates;
