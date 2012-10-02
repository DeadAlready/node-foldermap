'use strict';

var fs = require('fs');
var path = require('path');
var props = ['_path','_name','_ext','_type','_content','_base'];

/**
 * Function to map a path structure
 * 
 * @param {String|Array|Object} filePath path(s) to map
 * @param {Boolean} [recursive=true]
 * @param {Function} callback
 */
function _map(filePath, recursive, callback){
  if(recursive instanceof Function){
    callback = recursive;
    recursive = true;
  }
  
  if(typeof filePath === 'string'){
    _mapTree(filePath, recursive, callback);
  } else if(typeof filePath === 'object'){
    var errors = [];
    var info = {};
    var count;
    if(typeof filePath.length !== 'undefined'){
      count = filePath.length;
      if(count === 0){
        callback(null, {});
      }
      filePath.forEach(function(el){
        _mapTree(el, recursive, function(err, map){
          if(err){
            errors.push(err);
          } else {
            info[map._name] = map;
          }
          
          if(--count === 0){
            callback(errors.length ? errors : null, info);
          }
        });
      });
    } else {
      var keys = Object.keys(filePath);
      count = keys.length;
      if(count === 0){
        callback(null, {});
      }
      keys.forEach(function(key){
        _mapTree(filePath[key], recursive, function(err, map){
          if(err){
            errors.push(err);
          } else {
            info[key] = map;
          }
          if(--count === 0){
            callback(errors.length ? errors : null, info);
          }
        });
      });
    }
  } else {
    callback(new TypeError('FilePath must be a string, array or object'));
  }
}

/**
 * Function to map a path structure
 * 
 * @param {String} filePath path to map
 * @param {Boolean} [recursive=true]
 * @param {Function} callback
 */
function _mapTree(filePath, recursive, callback){
  if(recursive instanceof Function){
    callback = recursive;
    recursive = true;
  }
  var dir = false;
  
  if(filePath.charAt(filePath.length -1) === '*'){
    filePath = filePath.substr(0, filePath.length -2);
    dir = true;
  }
  
  if(!dir){
    _mapFile(filePath, recursive, callback);
    return;
  }
  
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
    filePath = _fixPath(filePath);
    if(info._type === 'directory'){
      fs.readdir(filePath, function(err, files){
        if(err){
          if(!haveErr){ // Call error only once
            haveErr = true;
            callback(err);
          }
          return;
        }
        var count = files.length;
        if(count === 0){
          callback(null, info);
          return;
        }
        
        files.forEach(function(el){
          _mapFile(filePath + el, recursive, function(err, map){
            if(err){
              if(!haveErr){ // Call error only once
                haveErr = true;
                callback(err);
              }
              return;
            }
            
            // Fill children array
            if(props.indexOf(map._name)>=0){
              console.log('Warning child name collision with property ' + map._name +', child not appended');
            } else {
              info[map._name] = map;
            }
            
            if(--count === 0){
              callback(null, info);
            }
          });
        });
      });
    } else {
      callback(null, info);
    }
  });
}

/**
 * Function to map a file structure
 * 
 * @param {String} filePath path to map
 * @param {Boolean} [recursive=true]
 * @param {Function} callback
 */
function _mapFile(filePath, recursive, callback){
  if(recursive instanceof Function){
    callback = recursive;
    recursive = true;
  }
  
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
    if(info._type === 'directory' && recursive){
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
          _mapFile(filePath + child, function(err, childTree){
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
 * Function to map a path structure
 * 
 * @param {String|Array|Object} filePath path(s) to map
 * @param {Boolean} [recursive=true]
 * @param {Function} callback
 */
function _mapSync(filePath, recursive){
  if(typeof filePath === 'string'){
    return _mapTreeSync(filePath, recursive);
  } else if(typeof filePath === 'object'){
    var errors = [];
    var info = {};
    if(typeof filePath.length !== 'undefined'){
      filePath.forEach(function(el){
        var map = _mapTreeSync(el, recursive);
        info[map._name] = map;
      });
      return info;
      
    } else {
      var keys = Object.keys(filePath);
      keys.forEach(function(key){
        var map = _mapTreeSync(filePath[key], recursive);
        info[key] = map;
      });
      return info;
    }
  } else {
    throw new TypeError('FilePath must be a string, array or object');
  }
}

/**
 * Function for mapping path synchronously
 * 
 * @param {String} filePath path to map
 * @param {Boolean} [recursive=true] wheter to map recursively
 * @return {Object}
 */
function _mapTreeSync(filePath, recursive){
  recursive = recursive === undefined ? true : recursive;
  
  var info;
  
  if(filePath.charAt(filePath.length-1) === '*'){
    filePath = filePath.substr(0, filePath.length-2);
    info = _mapFileSync(filePath);
    filePath = _fixPath(filePath);
    fs.readdirSync(filePath).forEach(function(child){
      if(props.indexOf(child._name)>=0){
        console.log('Warning child name collision with property ' + child._name +', child not appended');
      } else {
        info[child] = _mapFileSync(filePath + child, recursive);
      }
    });
  } else {
    info = _mapFileSync(filePath, recursive);
  }
  
  return info;
}

/**
 * Function for mapping file synchronously
 * 
 * @param {String} filePath path to map
 * @param {Boolean} [recursive=true] wheter to map recursively
 * @return {Object}
 */
function _mapFileSync(filePath, recursive){
  recursive = recursive === undefined ? true : recursive;
  var stats = fs.statSync(filePath);

  var info = _mapInfo(filePath, stats);

  if(info._type === 'directory' && recursive){
    filePath = _fixPath(filePath);
    fs.readdirSync(filePath).forEach(function(child){
      var child = _mapFileSync(filePath + child);
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
  map: _map,
  mapSync: _mapSync
}