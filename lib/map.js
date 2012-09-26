'use strict';

var fs = require('fs');
var path = require('path');

/**
 * Function to map a folder structure
 * 
 * @param filePath {String} path to map
 * @param callback {Function}
 */
function _mapTree(filePath, callback){
  var haveErr = false;
  // Get current paths stats
  fs.stat(filePath, function(err, stats){
    if(err){
      if(!haveErr){ // Call error only once
        haveErr = true;
        callback(err);
      }
      return;
    }
    // Load info
    var info = {
      path: filePath,
      name: path.basename(filePath),
      type: stats.isDirectory() ? 'directory' : (stats.isFile() ? 'file' : 'unknown')
    };
    
    if(info.type === 'file'){
      info.ext = path.extname(info.name);
    }
    // If we have a directory then map its contents
    if(info.type === 'directory'){
      fs.readdir(filePath, function(err, subTrees){
        if(err){
          if(!haveErr){
            haveErr = true;
            callback(err);
          }
          return;
        }
        
        var count = subTrees.length;
        info.children = {};
        // If the directory is empty then return
        if(count === 0){
          callback(null, info);
          return;
        }
        filePath = _fixPath(filePath);
        // Call mapTree to children
        subTrees.forEach(function(child){
          _mapTree(filePath + child, function(err, childTree){
            if(err){
              if(!haveErr){
                haveErr = true;
                callback(err);
              }
              return;
            }
            // Fill children array
            info.children[childTree.name] = childTree;
            if(--count === 0){
              callback(null, info);
            }
          });
        });
      });
    } else { // Not a directory
      callback(null, info);
    }
  });
}

/**
 * Function for mapping folder synchronously
 * 
 * @param filePath {String} path to map
 * @return {Object}
 */
function _mapTreeSync(filePath){
  var stats = fs.statSync(filePath);
  
  var info = {
    path: filePath,
    name: path.basename(filePath),
    type: stats.isDirectory() ? 'directory' : (stats.isFile() ? 'file' : 'unknown')
  };
    
  if(info.type === 'file'){
    info.ext = path.extname(info.name);
  }
    
  if(info.type === 'directory'){
    info.children = {};
    filePath = _fixPath(filePath);
    fs.readdirSync(filePath).forEach(function(child){
      var child = _mapTreeSync(filePath + child);
      info.children[child.name] = child;
    });
  }
  
  return info;
}

function _fixPath(filePath){
  if(filePath.charAt(filePath.length-1) !== path.sep){
    filePath += path.sep;
  }
  return filePath;
}

module.exports = {
  mapTree: _mapTree,
  mapTreeSync: _mapTreeSync
}