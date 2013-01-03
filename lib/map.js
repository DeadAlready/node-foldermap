'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var props = ['_path','_name','_ext','_type','_content','_read','_write','_base','_add','_delete'];

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

function _map(){
  if(arguments[arguments.length-1] instanceof Function === false){
    return _mapSync.apply(this, arguments);
  }
  _mapAsync.apply(this, arguments);
}

/**
 * Function to map a path structure
 * 
 * @param {String|Array|Object} filePath path(s) to map
 * @param {Function} callback
 */
function _mapAsync(filePath, callback){
  
  if(typeof filePath !== 'string' && typeof filePath !== 'object'){
    callback(new TypeError('FilePath must be a string, array or object'));
    return;
  }
  
  function cb(err, info){
    if(info){
      info = _internalRefs(info);
    }
    callback(err, info);
  }
  
  // Simple filepath
  if(typeof filePath === 'string'){
    _mapTree({path:filePath},cb);
    return;
  }
  
  if(typeof filePath.length === 'undefined'){ //Object type
    _mapTree(filePath, cb);
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
      info = _internalRefs(info);
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
          if(childTree._type === 'file' && filePath.type && path.extname(child) !== '.' + filePath.type){
            return then();
          }
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
    return _internalRefs(_mapTreeSync({path:filePath}));
  }
  
  // We dont have array so pass through
  if(typeof filePath.length === 'undefined'){
    return _internalRefs(_mapTreeSync(filePath));
  }

  var info = {};
  filePath.forEach(function(el){
    var map = _mapSync(el);
    info[el.name || map._name] = map;
  });
  return _internalRefs(info);
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
  _internalRefs(info);
  return info;
}

function _internalRefs(info){
  for(var i in info){
    Object.defineProperty(info[i],'__parent',{value:info});
    _internalRefs(info[i]);
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
  fs.readdirSync(filePath.path).forEach(function(childName){
    if(filePath.type && path.extname(childName) !== '.' + filePath.type && path.extname(childName) !== ''){
      return;
    }
    if(filePath.match && childName.match(new RegExp(filePath.match)) === null){
      return;
    }
    var newPath = clone(filePath);
    newPath.path = _fixPath(filePath.path) + childName;
    delete newPath.name;
    var child = _mapFileSync(newPath);
    if(child){
      if(child._type === 'file' && filePath.type && path.extname(childName) !== '.' + filePath.type){
        return;
      }
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
  if(type === 'file'){
    Object.defineProperties(info, {
      '_content':{
        get: function(){ return fs.readFileSync(filePath, 'utf8'); },
        set: function(c){ fs.writeFileSync(filePath, c, 'utf8'); }
      },
      '_read':{
        value:function(callback){
          if(callback){
            fs.readFile(filePath, 'utf8', callback);
            return;
          }
          return fs.createReadStream(filePath);
        }
      },
      '_write':{
        value: function(content, callback){
          if(content === undefined && callback === undefined){
            return fs.createWriteStream(filePath);
          }
          if(typeof content !== 'string'){
            throw new TypeError('Content must be string');
          }
          if(callback === undefined){
            return fs.writeFileSync(filePath, content, 'utf8');
          }
          fs.writeFile(filePath, content, callback);
        }
      },
      '_delete':{
        value:function(callback){
          if(callback){
            fs.unlink(filePath, function(){
              if(err){
                callback(err);
                return;
              }
              var parent = info.__parent;
              delete parent[info._name];
              callback(null, parent);
            });
            return;
          }
          fs.unlinkSync(filePath);
          var parent = info.__parent;
          delete parent[info._name];
          return parent;
        }
      }
    });
  }
  
  if(type === 'directory'){
    Object.defineProperties(info, {
      '_add':{
        value:function(){
          return _add.apply(info, arguments);
        }
      },
      '_delete':{
        value:function(force, callback){
          if(force instanceof Function){
            callback = force;
            force = false;
          }
          
          function end(err){
            if(err){
              callback(err);
              return;
            }
            var parent = info.__parent;
            delete parent[info._name];
            callback(null, parent);
          }
          
          if(callback){
            if(!force){
              fs.rmdir(filePath, end);
              return;
            }
            rimraf(filePath, end);
            return;
          }
          if(!force){
            fs.rmdirSync(filePath);
            var parent = info.__parent;
            delete parent[info._name];
            return parent;
          }
          rimraf.sync(filePath);
          var parent = info.__parent;
          delete parent[info._name];
          return parent;
        }
      }
    });
  }
  
  // Assign info
  Object.defineProperties(info,{
    '_path':{
      value: path.resolve(filePath)
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
    }
  });
  return info;
}

function _add(filePath, content, callback){
  if(filePath === undefined){
    throw new TypeError('FilePath must be a defined');
  }
  var dir = false;
  if(typeof filePath === 'object'){
    if(filePath.path === undefined){
      throw new TypeError('FilePath.path must be a defined');
    }
    if(filePath.type && filePath.type === 'directory'){
      dir = true;
    }
  }
  
  if(content instanceof Function){
    callback = content;
    content = undefined;
  }
  
  if(content === undefined && callback === undefined
    || typeof content === 'string' && callback === undefined){
    
    var info = !dir ? _addFileSync.call(this, filePath, content) : _addFolderSync.call(this, filePath);
    _internalRefs(this);
    return info;
  }
  if(!dir){
    _addFile.call(this, filePath, content, callback);
  } else {
    _addFolder.call(this, filePath, callback);
  }
}

function _addFolder(filePath, callback){
  var self = this;
  
  var folderArr = path.join(filePath).split(path.sep);
  var next = folderArr.shift();
  while(self[next]){
    var self = self[next];
    if(folderArr.length){
      next = folderArr.shift();
    } else {
      next = false;
      break;
    }
  }
  if(next){
    folderArr.unshift(next);
  }
  if(folderArr.length < 1){
    return callback(null, self);
  }
  var fullPath = path.join(self._path, folderArr.join(path.sep));
  
  mkdirp(fullPath, function(){
    _addFileInfo(self, folderArr, function(err, info){
      _internalRefs(self);
      callback(err, info);
    });
  });
}

function _addFolderSync(filePath){
  var self = this;
  
  var folderArr = path.join(filePath).split(path.sep);
  var next = folderArr.shift();
  while(self[next]){
    var self = self[next];
    if(folderArr.length){
      next = folderArr.shift();
    } else {
      next = false;
      break;
    }
  }
  if(next){
    folderArr.unshift(next);
  }
  if(folderArr.length < 1){
    return self;
  }
  
  var fullPath = path.join(self._path, folderArr.join(path.sep));
  mkdirp.sync(fullPath);
  return _addFileInfoSync(self, folderArr);
}

function _addFile(filePath, content, callback){
  if(content instanceof Function){
    callback = content;
    content = '';
  }
  var self = this;
  if(filePath === ''){
    callback(self);
  }
  filePath = path.join(filePath);
  var filename = path.basename(filePath, path.sep);
  var dirPath = path.dirname(filePath);
  if(dirPath === '.'){
    _makeFile();
  } else {
    _addFolder.call(self, dirPath, function(err, info){
      if(err){
        callback(err);
        return;
      }
      self = info;
      _makeFile();
    });
  }
  
  function _makeFile(){
    var fPath = path.join(self._path, filename);
    fs.writeFile(fPath, content,'utf8',function(err){
      if(err){
        callback(err);
        return;
      }
      fs.stat(fPath, function(err, stats){
        if(err){
          callback(err);
          return;
        }
        var info = _mapInfo(fPath, stats);
        self[info._name] = info;
        _internalRefs(self);
        if(content === ''){
          callback(null, info._write());
        } else {
          callback(null, info);
        }
      });
    });
  }
}

function _addFileSync(filePath, content){
  var self = this;
  if(filePath === ''){
    return self;
  }
  content = content || '';
  filePath = path.join(filePath);
  
  var filename = path.basename(filePath, path.sep);
  var dirPath = path.dirname(filePath);
  if(dirPath === '.'){
    var folder = self;
  } else {
    var folder = _addFolderSync.call(self, dirPath);
  }
  filePath = path.resolve(path.join(folder._path, filename));
  fs.writeFileSync(filePath, content, 'utf8');
  var file = _mapInfo(filePath, fs.statSync(filePath));
  folder[file._name] = file;
  if(content === ''){
    return file._write();
  }
  return file;
}

function _addFileInfo(info, fileArr, callback){
  if(fileArr.length < 1){
    callback(null, info);
  }
  var current = path.basename(fileArr.shift(), path.sep);
  var filePath = path.join(info._path, current);
  fs.stat(filePath, function(err, stats){
    if(err){
      callback(err);
      return;
    }
    info[current] = _mapInfo(filePath, stats);
    if(fileArr.length < 1){
      callback(null, info[current]);
    } else {
      _addFileInfo(info[current], fileArr, callback);
    }
  });
}

function _addFileInfoSync(info, fileArr){
  var pointer = info;
  for(var i in fileArr){
    var filePath = path.join(pointer._path, fileArr[i]);
    var temp = _mapInfo(filePath, fs.statSync(filePath));
    pointer[temp._name] = temp;
    pointer = temp;
  }
  return pointer;
}
//
//function _addFolder(filePath, callback){
//  if(filePath === undefined){
//    throw new TypeError('FilePath must be a string');
//  }
//  if(callback === undefined){
//    return _addFolderSync.call(this,filePath);
//  }
//  
//  _addFolder.call(this, filePath, callback);
//}

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