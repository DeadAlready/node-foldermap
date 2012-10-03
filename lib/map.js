'use strict';

var fs = require('fs');
var path = require('path');
var props = ['_path','_name','_ext','_type','_content','_base'];

/**
 * Function for creating a clone of an object
 * 
 * @param o {Object}  object to clone
 * @return {Object}
 */
function clone(o){
  var c = {};
  var h = Object.keys(o);
  for(var i = 0, co = h.length; i < co; i++){
    c[h[i]] = o[h[i]];
  }
  return c;
}

/**
 * Transfer properties from one object to the other
 * 
 * @param {Object} a -> target object
 * @param {Object} b -> object to transfer from
 * @return {Object}
 */
function transfer(a, b){
  for(var i in b){
    a[i] = b[i];
  }
  return a;
}

/**
 * Function to map a path structure
 * 
 * @param {String|Array|Object} filePath path(s) to map
 * @param {Function} callback
 */
function _map(filePath, callback){
  
  if(typeof filePath !== 'string' && typeof filePath !== 'object'){
    callback(new TypeError('FilePath must be a string, array or object'));
    return;
  }
  
  // Simple filepath
  if(typeof filePath === 'string'){
    _mapTree({path:filePath}, callback);
    return;
  }
  
  if(typeof filePath.length === 'undefined'){ //Object type
    _mapTree(filePath, callback);
    return;
  }
    
  var errors = [];
  var info = {};
  var count = filePath.length;
  if(count === 0){
    callback(null, {});
  }
  filePath.forEach(function(el){
    _map(el, function(err, map){
      if(err){
        errors.push(err);
      } else {
        info[el.name || map._name] = map;
      }

      if(--count === 0){
        callback(errors.length ? errors : null, info);
      }
    });
  });
}

/**
 * Function to map a path structure
 * 
 * @param {Object} filePath path to map
 * @param {Function} callback
 */
function _mapTree(filePath, callback){
  
  if(filePath.path === undefined){
    callback(new Error('Object.path must be defined'));
    return;
  }
  
  if(filePath.path.charAt(filePath.path.length -1) === '*'){
    filePath.match = path.basename(filePath.path, '*');
    filePath.path = path.dirname(filePath.path);
    _mapDirectory(filePath, callback);
    return;
  }
  
  _mapFile(filePath, callback);
}

/**
 * Function to map a file structure
 * 
 * @param {Object} filePath path to map
 * @param {Function} callback
 */
function _mapFile(filePath, callback){
  
  // Get current paths stats
  fs.stat(filePath.path, function(err, stats){
    if(err){
      callback(err);
      return;
    }
    
    var info = _mapInfo(filePath.path, stats);
    
    // If we have a directory then map its contents
    if(info._type === 'directory' && filePath.recursive !== false){
      _mapDirectory(filePath, function(err, map){
        if(err){
          callback(err);
          return;
        }
        if(filePath.type && Object.keys(map).length === 0){
          callback(null, false);
          return;
        }
        callback(null, transfer(info, map));
      });
    } else { // Not a directory
      callback(null, info);
    }
  });
}

/**
 * Function to map files in a directory
 * 
 * @param {Object} filePath path to map
 * @param {Function} callback
 */
function _mapDirectory(filePath, callback){
  var info = {};
  fs.readdir(filePath.path, function(err, subTrees){
    if(err){
      callback(err);
      return;
    }

    var count = subTrees.length;
    // If the directory is empty then return
    if(count === 0){
      callback(null, info);
      return;
    }
    var directory = _fixPath(filePath.path);
    // Call mapTree to children
    subTrees.forEach(function(child){
      if(filePath.type && path.extname(child) !== '.' + filePath.type && path.extname(child) !== ''){
        return then();
      }
      if(filePath.match && child.match(new RegExp(filePath.match)) === null){
        return then();
      }
      var newPath = clone(filePath);
      newPath.path = directory + child;
      delete newPath.name;
      _mapFile(newPath, function(err, childTree){
        if(err){
          if(!haveErr){
            haveErr = true;
            callback(err);
          }
          return;
        }
        if(childTree){
          // Fill children array
          if(props.indexOf(childTree._name)>=0){
            console.log('Warning child name collision with property ' + childTree._name +', child not appended');
          } else {
            info[childTree._name] = childTree;
          }
        }

        then();
      });
    });

    function then(){
      if(--count === 0){
        callback(null, info);
      }
    }
  });
}

/**
 * Function to map a path structure
 * 
 * @param {String|Array|Object} filePath path(s) to map
 * @param {Function} callback
 */
function _mapSync(filePath){
  if(typeof filePath !== 'string' && typeof filePath !== 'object'){
    throw new TypeError('FilePath must be a string, array or object');
  }
  
  if(typeof filePath === 'string'){
    return _mapTreeSync({path:filePath});
  }
  
  // We dont have array so pass through
  if(typeof filePath.length === 'undefined'){
    return _mapTreeSync(filePath);
  }

  var info = {};
  filePath.forEach(function(el){
    var map = _mapSync(el);
    info[el.name || map._name] = map;
  });
  return info;
}

/**
 * Function for mapping path synchronously
 * 
 * @param {Object} filePath path to map
 * @return {Object}
 */
function _mapTreeSync(filePath){
  
  if(!filePath.path){
    throw new TypeError('Object.path must be defined');
  }
  
  if(filePath.path.charAt(filePath.path.length-1) === '*'){
    filePath.match = path.basename(filePath.path, '*');
    filePath.path = path.dirname(filePath.path);
    return _mapDirectorySync(filePath);
  }
  
  return _mapFileSync(filePath);
}

/**
 * Function for mapping file synchronously
 * 
 * @param {String} filePath path to map
 * @return {Object}
 */
function _mapFileSync(filePath){
  
  var stats = fs.statSync(filePath.path);

  var info = _mapInfo(filePath.path, stats);

  if(info._type === 'directory' && filePath.recursive !== false){
    var temp = _mapDirectorySync(filePath);
    if(!filePath.type || Object.keys(temp).length > 0){
      return transfer(info, temp);
    }
    return false;
  }
  return info;
}

/**
 * Function for mapping directory contents synchronously
 * 
 * @param {Object} filePath path to map
 * @return {Object}
 */
function _mapDirectorySync(filePath){
  var info = {};
  fs.readdirSync(filePath.path).forEach(function(child){
    if(filePath.type && path.extname(child) !== '.' + filePath.type && path.extname(child) !== ''){
      return;
    }
    if(filePath.match && child.match(new RegExp(filePath.match)) === null){
      return;
    }
    var newPath = clone(filePath);
    newPath.path = _fixPath(filePath.path) + child;
    delete newPath.name;
    var child = _mapFileSync(newPath);
    if(child){
      if(props.indexOf(child._name)>=0){
        console.log('Warning child name collision with property ' + child._name +', child not appended');
      } else {
        info[child._name] = child;
      }
    }
  });
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