const tv4 = require( 'tv4' )
const formats = require( 'tv4-formats' )
const referenceSchema = require( '../../schema/reference.schema.json' )
const tagsSchema = require( '../../schema/tags.schema.json' )

tv4.addFormat( formats )
tv4.addSchema( referenceSchema )
tv4.addSchema( tagsSchema )

module.exports = tv4
