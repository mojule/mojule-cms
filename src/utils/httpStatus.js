'use strict'

class HttpStatus {
  constructor( code, message ) {
    this.code = code
    this.message = message
  }
  toFormat(  ) {
    const args = Array.from( arguments )
    const extend = args.join()
    let result = `${this.code} - ${this.message}`
    if ( extend ) {
       result = `${result}: ${extend}`
    }
    return result
  }
}


/**
 *
 */
const httpStatusUtils = {
  /**
   *Encapsulates Http Status codes and messages
   */
  httpStatus: {
    _200Ok: new HttpStatus( 200, 'Ok' ),
    _201Created: new HttpStatus( 201, 'Created' ),
    _202Accepted: new HttpStatus( 202, 'Accepted' ),
    _204NoContent: new HttpStatus( 204, 'No Content' ),
    _304NotModified: new HttpStatus( 304, 'Not Modified' ),
    _400BadRequest: new HttpStatus( 400, 'Bad Request' ),
    _401Unauthorized: new HttpStatus( 401, 'Unauthorized' ),
    _403Forbidden: new HttpStatus( 403, 'Forbidden' ),
    _404NotFound: new HttpStatus( 404, 'Not Found' ),
    _500InternalServerError: new HttpStatus( 500, 'Internal Server Error' ),
    _501NotImplemented: new HttpStatus( 501, 'Not Implemented' )
  }
}

module.exports = httpStatusUtils