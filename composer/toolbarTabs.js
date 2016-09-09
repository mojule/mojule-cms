var toolbarTabs = {
  file: {
    title: 'File',
    groups: {
      'store': {
        title: 'Save & Publish',
        type: 'button',
        template: 'toolbar-icon',
        items: {
          'save': {
            title: 'Save',
            icon: 'floppy-o'
          },
          'publish': {
            title: 'Publish',
            icon: 'print'
          }
        }
      }
    }
  },
  create: {
    title: 'Create',
    groups: {
      "add-new": {
        title: 'Add New',
        type: 'drag',
        template: 'toolbar-drag',
        items: {}
      }
    }
  },    
  edit: {
    title: 'Edit',
    inactive: true,
    groups: {}
  },    
  view: {
    title: 'View',
    groups: {
      "display-mode": {
        title: 'Display Mode',
        type: 'select-single',
        template: 'toolbar-icon',
        items: {
          large: {
            title: 'Large',
            icon: 'desktop',
            selected: true
          },
          medium: {
            title: 'Medium',
            icon: 'tablet'
          },
          small: {
            title: 'Small',
            icon: 'mobile'
          }
        }
      },
      'preview': {
        title: 'Preview',
        type: 'button',
        template: 'toolbar-icon',
        items: {
          'view-page': {
            title: 'Preview Page',
            icon: 'eye'
          }
        }
      }
    }
  }
};

module.exports = toolbarTabs;