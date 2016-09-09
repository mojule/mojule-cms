'use strict'
/**
 * @module Tests for configurator
 * Note - does not attempt to test settings of environment or node arguments.
 * These can be added in launch.json using "env" and "runtimeArgs" properties.
 * IMPORTANT - It is not possible to properly test this code as
 *  configurator uses nconf and nconf can only be configured once per mocha run. (i.e. nconf remembers state)
 */

const path = require( 'path' )
const assert = require( 'assert' )


describe( 'Configurator Tests', () => {
    // Only very basic test possible - see above
    it( 'should test configurator returns file defined values', () => {
      const Configurator = require( '../src/configurator' )
      const configFile = path.join( process.cwd(), './test/fixtures/testconfiguration.json' )
      const configurator = Configurator( configFile )
      const nodeenv = configurator.nodeenv()
      assert.equal( nodeenv, undefined )
      const appinsights = configurator.azure().appinsightskey
      assert.equal( appinsights, 'testfile_appinsightskey' )
      const recaptcha = configurator.recaptcha()
      assert.equal( recaptcha.sitekey, 'testfile_recaptcha_sitekey' )
    })

})