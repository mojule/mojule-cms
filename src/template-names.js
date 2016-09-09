'use strict'

const common = [
  'data-attr',

  'toolbar-tab-headers', 'toolbar-tab', 'toolbar-group',
  'toolbar-icon', 'toolbar-small', 'toolbar-drag', 'toolbar-preview',
  'toolbar-number', 'toolbar-switch',

  'dialog-ok-cancel',
  'link-dialog', 'template-dialog', 'image-dialog', 'preview-dialog', 'form-dialog', 'list-dialog', 'list-builder-dialog',
  'page-access-dialog',

  'tags-filter', 'icon-library', 'filter-icon-library', 'flex-library', 'filter-flex-library',

  'form', 'modelForm', 'modelArrayField', 'modelInputs',
  'panel',
  'list-builder', 'list-builder-selection', 'list-builder-selection-item'
]

const composer = [
  'component', 'componentHeader', 'document', 'columns', 'column', 'box', 'linkBox',
  'template', 'navigation', 'navigation-links', 'subnavigation', 'slide',
  'paragraph', 'heading', 'ul', 'ol', 'image', 'imageText', 'grid', 'textImage',
  'gridBlock', 'carousel', 'tabs', 'tab', 'html', 'block',
  'breadcrumbs', 'sitemap', 'sitemap-node', 'pagePager', 'siteUserActions', 'userActions',
  'pagination', 'composerForm', 'formText', 'formEmail', 'formMultiline', 'formCheckbox', 'formDropdown', 'formInstance'
]

const templateNames = {
  common,
  composer
}

module.exports = templateNames
