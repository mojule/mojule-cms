'use strict'

const graphUtils = require( './graph' )
const objectUtils = require( './object' )
const promiseUtils = require( './promise' )
const randomUtils = require( './random' )
const stringUtils = require( './string' )
const templateUtils = require( './template' )
const arrayUtils = require( './array' )
const httpStatusUtils = require( './httpStatus' )

/**
 * @const utils - aggregates all util functions int a single object to simplify calling.
 * @example utils.deepAssign.
 */
const utils = Object.assign(
  {},
  graphUtils,
  objectUtils,
  promiseUtils,
  randomUtils,
  stringUtils,
  templateUtils,
  arrayUtils,
  httpStatusUtils
)

module.exports = utils
