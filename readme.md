# mojule

Web page builder + CMS (prototype)

mojule aims to be a modular CMS with web builder functionality (eg drag and drop
page editor)

This prototype contains some of what we intend to be in the final product and is
stable enough that we are using it in production for client sites, but is
missing many planned features, lacking in niceties in many places etc.

## Documentation

We're still lacking much in the way of documentation etc. - this will be coming

## Currently supports

 - Creating and managing multiple sites, pages etc.
 - Image/file upload, resizing etc.
 - Manage user permissions (can edit everything, can edit just a couple of sections on a page etc.)
 - Drag and drop page builder
 - Drag and drop prefab builder (for page templates, reusable common elements etc.)
 - Upload stylesheets and apply styles in page builder
 - Drag and drop form builder (limited!)
 - Protected parts of site that your website visitors have to register/login to see
 - Responsive including lazy loading images etc.

## Installing

Clone/download this repository and then...

### configuration.json

Add `configuration.json` to the root:

```json
{
  "sendgrid": {
    "apikey": ""
  },
  "recaptcha": {
    "sitekey": "",
    "secretkey": ""
  },
  "smtp": {
    "host": "",
    "port": 0,
    "secure": true,
    "user": "",
    "pass": ""
  },
  "imageResize": {
    "presize": true
  },
  "masterUser": {
		"email": "",
		"password": ""
	}
}
```

You only need either the smtp section or the sendgrid section, depending on what
emailer you want to use (edit dependencies.js to select which, see below)

The sections should be self explanatory aside from imageResize -

If presize it true, each image that you upload to the CMS will be automatically
resized to a bunch of set sizes - the responsive lazy loaded images served to
your website visitors will use the closest size - this option slows down
uploading but reduces server load and the response time for the end user

If presize is false, images will be generated on demand (though cached), at
whatever size the browser requests depending on the device resolution etc.

`masterUser` is only required on the first run - once you've logged in as this
user you can (and should) remove it from `configuration.json` - this should
probably be done automatically, now that I think about it

### And then...

You should have node 6 or newer, as well as browserify and grunt installed
globally (and that should be all - however, I have yet to test from a clean
environment - will update if I learn otherwise)

`npm install` in the root folder.

then navigate to the ./client folder, and `npm install` there as well.

run `grunt` in the ./client folder to generate the front end JS

You should then be able to run the CMS with `node server` from the root

### dependencies.js

mojule is db agnostic, image resizer agnostic and emailer agnostic

We currently have db bindings for leveldb and nedb - see ./dependencies/store

We have emailer bindings for both smtp and sendgrid, see ./dependencies/email

We have an image resizer binding that uses JIMP - we can't release the image
resizer we use internally so we've created this binding. JIMP is a great
library, but a bit slow so you may want to replace it with something faster

You can set the db, email and image resizers in ./dependencies.js:

```javascript
'use strict'

const Store = require( './dependencies/store/leveldb-store' )
const emailer = require( './dependencies/email/smtp' )
const imageResizer = require( './dependencies/images/jimp-resizer' )
const getImageSize = require( './dependencies/images/jimp-getsize' )

const dependencies = {
  Store, emailer, imageResizer, getImageSize
}

module.exports = dependencies

```

## Modifying, extending etc.

### Composer Components

TODO

### Composer Modules

TODO

### Dialogs
