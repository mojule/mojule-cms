'use strict'

const path = require( 'path' )
const Templates = require( './templates' )
const Template = Templates.Template

const engine = {
  init: function( filePath, ext, callback ){
    var templates = new Templates( ext );
    templates.load( filePath, function( err ){
      if( err ){
        callback( err );
        return;
      }

      engine.templates = templates;

      callback( null );
    });
  },
  initP: ( filePath, ext ) => new Promise(
    ( resolve, reject ) => {
      engine.init( filePath, ext, err => {
        if( err ){
          reject( err )
        } else {
          resolve()
        }
      })
    }
  ),
  add: function( templatePath, callback ){
    Template.load( templatePath, function( err, template ){
      if( err ){
        callback( err );
        return;
      }

      engine.templates.add( template );
      callback( null );
    });
  },
  render: function( filePath, options, callback ){
    var name = path.parse( filePath ).name

    if( !engine.templates[ name ] ){
      callback( new Error( 'No such template ' + name ) )
      return
    }

    options = Object.assign( options, {
      yield: engine.templates[ name ]( options )
    })

    var rendered = engine.templates[ options.settings.layout ]( options )

    callback( null, rendered )
  }
}

module.exports = engine
