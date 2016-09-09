module.exports = function( $, templates, persistence, options ){
  var components = {};

  components[ 'box' ] = require( './components/component.box' )( $, templates, persistence, options );
  components[ 'linkBox' ] = require( './components/component.linkBox' )( $, templates, persistence, options );
  components[ 'carousel' ] = require( './components/component.carousel' )( $, templates, persistence, options );
  components[ 'column' ] = require( './components/component.column' )( $, templates, persistence, options );
  components[ 'columns' ] = require( './components/component.columns' )( $, templates, persistence, options );
  components[ 'document' ] = require( './components/component.document' )( $, templates, persistence, options );
  components[ 'grid' ] = require( './components/component.grid' )( $, templates, persistence, options );
  components[ 'gridBlock' ] = require( './components/component.gridBlock' )( $, templates, persistence, options );
  components[ 'heading' ] = require( './components/component.heading' )( $, templates, persistence, options );
  components[ 'html' ] = require( './components/component.html' )( $, templates, persistence, options );
  components[ 'image' ] = require( './components/component.image' )( $, templates, persistence, options );
  components[ 'imageText' ] = require( './components/component.imageText' )( $, templates, persistence, options );
  components[ 'navigation' ] = require( './components/component.navigation' )( $, templates, persistence, options );
  components[ 'subnavigation' ] = require( './components/component.subnavigation' )( $, templates, persistence, options );
  components[ 'sitemap' ] = require( './components/component.sitemap' )( $, templates, persistence, options );
  components[ 'ol' ] = require( './components/component.ol' )( $, templates, persistence, options );
  components[ 'paragraph' ] = require( './components/component.paragraph' )( $, templates, persistence, options );
  components[ 'slide' ] = require( './components/component.slide' )( $, templates, persistence, options );
  components[ 'tab' ] = require( './components/component.tab' )( $, templates, persistence, options );
  components[ 'tabs' ] = require( './components/component.tabs' )( $, templates, persistence, options );
  components[ 'block' ] = require( './components/component.block' )( $, templates, persistence, options );
  components[ 'template' ] = require( './components/component.template' )( $, templates, persistence, options );
  components[ 'ul' ] = require( './components/component.ul' )( $, templates, persistence, options );
  components[ 'form' ] = require( './components/component.form' )( $, templates, persistence, options );
  components[ 'formText' ] = require( './components/component.formText' )( $, templates, persistence, options );
  components[ 'formEmail' ] = require( './components/component.formEmail' )( $, templates, persistence, options );
  components[ 'formMultiline' ] = require( './components/component.formMultiline' )( $, templates, persistence, options );
  components[ 'formCheckbox' ] = require( './components/component.formCheckbox' )( $, templates, persistence, options );
  components[ 'formDropdown' ] = require( './components/component.formDropdown' )( $, templates, persistence, options );
  components[ 'formInstance' ] = require( './components/component.formInstance' )( $, templates, persistence, options );
  components[ 'userActions' ] = require( './components/component.userActions' )( $, templates, persistence, options );

  return components;
}