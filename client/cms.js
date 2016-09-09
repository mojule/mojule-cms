'use strict'

const ich = require( '../composer/templates' )
const persistence = require( '../composer/persistence' )
const formViewModels = require( '../composer/form-view-models' )
const dialogs = require( '../composer/dialogs' )( $, ich, persistence, formViewModels )
const composer = require( '../composer/composer' )

require( './polyfills' )

const Events = require( './events' )

window.mojule = window.mojule || {}

window.mojule.persistence = persistence
window.mojule.dialogs = dialogs
window.mojule.events = Events()
window.mojule.listify = require( './listify' )
window.mojule.listBuilder = require( './list-builder' )
window.mojule.composer = composer

require( './user-settings' )

//what if there are multiple forms?
const modelForm = document.querySelector( '.modelForm' )

if( modelForm != null ){
  window.mojule.listify( modelForm )
}

$( function(){
  const checklists = document.querySelectorAll( 'form ul.checklist' )

  Array.from( checklists ).forEach( window.mojule.listBuilder )

  composer()
})
