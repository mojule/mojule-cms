'use strict'

const utils = require( '../src/utils/utils' )

module.exports = function( persistence ){
  function walk(node, parent, depth, callback) {
    depth = depth || 0;

    var stop = callback(node, parent, depth);

    if (!stop && Array.isArray(node.children)) {
      node.children.forEach(function (child) {
        walk(child, node, depth + 1, callback);
      });
    }
  };

  function clean(document) {
    var cleaned = clone(document);

    walk(cleaned, null, 0, function (node) {
      delete node.values.changes;
    });

    return cleaned;
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  function find(node, predicate) {
    var result = void 0;

    walk(node, null, 0, function (n) {
      if (predicate(n)) {
        result = n;
        return true;
      }
    });

    return result;
  };

  function restoreBlock( block, templates ) {
    if( block.values.templateId === -1 ) return
    //how tf are non blocks getting through?
    if( block.key !== 'block' ) return

    var original = clean(block);
    var template = clean(templates[block.values.templateId]);

    block.children = template.children;

    //find unlocked nodes
    var unlocked = [];

    block.children.forEach(function (blockChild) {
      walk(blockChild, null, 0, function (n) {
        if (n.key === 'block') {
          restoreBlock( blockChild, templates );
        } else if (!n.values.isLocked) {
          unlocked.push(n);
        }
      });
    });

    unlocked.forEach(function (unlockedNode) {
      var originalNode = find(original, function (n) {
        return n._templateId === unlockedNode._id;
      });

      if( originalNode ){
        Object.assign(unlockedNode, clone(originalNode));
      }

      processBlocks( unlockedNode, templates );
    });
  };

  function processBlocks( document, templates ){
    //find all the blocks which are not inside other blocks
    var blocks = [];

    walk(document, null, 0, function (node) {
      if (node.key === 'block') {
        blocks.push(node);
        return true;
      }
    });

    blocks.forEach( function( block ){
      restoreBlock( block, templates )
    });
  }

  function ensureBlockIds( document ){
    var blocks = [];

    walk(document, null, 0, function (node) {
      if (node.key === 'block') {
        blocks.push(node);
      }
    });

    blocks.forEach( function( block ){
      walk(block, null, 0, function (node) {
        node._id = utils.randomId( node.key )
      });
    });
  }

  function restoreTemplates( document, callback ) {
    persistence.get( 'template', function( err, allTemplates ){
      if( err ){
        callback( err )
        return;
      }

      var templates = allTemplates.reduce( function( templates, template ){
        templates[ template._id ] = template
        return templates;
      }, {});

      processBlocks( document, templates )

      ensureBlockIds( document )

      callback( document )
    })
  }

  return restoreTemplates;
}
