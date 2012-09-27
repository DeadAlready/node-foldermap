'use strict';

var fs = require('fs');
var path = require('path');
var props = ['_path','_name','_ext','_type','_content','_base'];

/**
 * Function to map a folder structure
 * 
 * @param {String} filePath path to map
 * @param {Function} callback
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
    
    var info = _mapInfo(filePath, stats);
    
    // If we have a directory then map its contents
    if(info._type === 'directory'){
      fs.readdir(filePath, function(err, subTrees){
        if(err){
          if(!haveErr){
            haveErr = true;
            callback(err);
          }
          return;
        }
        
        var count = subTrees.length;
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
            if(props.indexOf(childTree._name)>=0){
              console.log('Warning child name collision with property ' + childTree._name +', child not appended');
            } else {
              info[childTree._name] = childTree;
            }
            
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
 * @param {String} filePath path to map
 * @return {Object}
 */
function _mapTreeSync(filePath){
  var stats = fs.statSync(filePath);
  
  var info = _mapInfo(filePath, stats);
    
  if(info._type === 'directory'){
    filePath = _fixPath(filePath);
    fs.readdirSync(filePath).forEach(function(child){
      var child = _mapTreeSync(filePath + child);
      if(props.indexOf(child._name)>=0){
        console.log('Warning child name collision with property ' + child._name +', child not appended');
      } else {
        info[child._name] = child;
      }
    });
  }
  
  return info;
}

/**
 * Function for mapping file properties into an object
 * 
 * @param {String} filePath path of the file
 * @param {Object} stats fs.stats object
 */
function _mapInfo(filePath, stats){
  var info = {};
  var type = stats.isDirectory() ? 'directory' : (stats.isFile() ? 'file' : 'unknown');
  var name = path.basename(filePath);
  var ext = type === 'file' ? path.extname(name) : '';
  ext = ext.indexOf('.') === 0 ? ext.substr(1) : ext;
  
  var get = type === 'file' ? function(){ return fs.readFileSync(filePath, 'utf8'); } : function(){ return undefined; };
  // Assign info
  Object.defineProperties(info,{
    '_path':{
      value: filePath
    },
    '_name':{
      value: name
    },
    '_base':{
      value: path.basename(filePath, '.' + ext)
    },
    '_type':{
      value: type
    },
    '_ext':{
      value: ext
    },
    '_content':{
      get: get
    }
  });
  return info;
}

/**
 * Function for appending path separator to the end of string if missing
 * 
 * @param {String} filePath string to check for path separator
 */
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