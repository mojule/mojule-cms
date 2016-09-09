'use strict'
/**
 * @function 
 * @name Reference
 * Turns a database object into a reference object.  i.e. Referece objects can be passed around without worrying about versions etc
 * @param dbitem - database object
 * @returns id of database object 
 */
const Reference = dbItem => {
  return {
    name: dbItem.name || 'Unnamed ' + dbItem.key,
    _id: dbItem._id
  }
}

module.exports = Reference