'use strict';

var fp = require('file-pointer');
var fs = require('fs');
var path = require('path');
var utils = require('./utils');

/**
 * Function for normalizing input
 * @param opts
 * @returns {*}
 */
function normalize(opts) {
	if (typeof opts === 'string') {
		opts = {path: opts};
	}
	opts.path = path.resolve(opts.path);
	return opts;
}

/**
 * Function for mapping a list of objects relative to root object
 *
 * @param root - Folder object
 * @param list - Array of file names
 * @param callback(err, result) - Function
 */
function mapObjects(root, list, callback) {
	var ret = {};
	var sent = false;
	var count = list.length;
	if (count === 0) {
		callback(null, ret);
	}
	list.forEach(function (pointer) {
		var name = path.join(root._path, pointer);
		fp.define({filePath: name, parent: root}, function (err, obj) {
			if (err) {
				if (!sent) {
					callback(err);
					sent = true;
				}
				return;
			}
			ret[name] = obj;
			if (ret[name]._type === 'directory') {
				addMaping(ret[name]);
			}
			if (--count === 0) {
				callback(null, ret);
			}
		});
	});

}

/**
 * Function for filtering pointer objects based on options
 *
 * @param pObjects - object with subobjects being pointer objects
 * @param opts - options to use when filtering
 * @param returnArray - return an array instead of object
 * @returns {*} || [*] - object or array with filtered results
 */
function filter(pObjects, opts, returnArray) {
	var filtered = returnArray ? [] : {};

    function addToFiltered(key) {
        if(returnArray) {
            filtered.push((returnArray === 'keys' ? key : pObjects[key]));
        } else {
            filtered[key] = pObjects[key];
        }
    }

    if (!opts) {
        Object.keys(pObjects).forEach();
        return;
    }

    function checkMatch(match, prop) {
        if(utils.isArray(match)){
            return match.indexOf(prop) !== -1;
        }
        return match === prop;
    }

	Object.keys(pObjects).forEach(function (key) {
        //Return only fp objects
        if(['File','Folder'].indexOf(pObjects[key].constructor.name) === -1) {
            return;
        }
        //Recursive directories always added
        if (opts.recursive && pObjects[key]._type === 'directory') {
            addToFiltered(key);
            return;
        }

        if (!opts.dotStart && pObjects[key]._name.charAt(0) === '.') {
            return;
        }

        if(opts.type && !checkMatch(opts.type, pObjects[key]._type)) {
            return;
        }

        if(opts.ext && pObjects[key]._type === 'file' && !checkMatch(opts.ext, pObjects[key]._ext)) {
            return;
        }

		if (opts.match && !pObjects[key]._name.match(opts.match)) {
			return;
		}
        if (opts.pathMatch && !pObjects[key]._path.match(opts.pathMatch)) {
            return;
        }
        addToFiltered(key);
	});

	return filtered;
}

/**
 * Function for transferring properties from map to root using opts
 *
 * @param root {Object} - object to attach new pointers to
 * @param map {Object} - object with properties being pointer objects
 * @param opts {Object} - options
 * @returns {Array} - Folders for recursive mapping
 */
function transfer(root, map, opts) {
	map = filter(map, opts);
	var folders = [];

	function getIndex(k) {
		var index = k;
		if (opts.relative) {
			var replace = opts.relative === true ? (root._path + path.sep) : opts.relative;
			index =  k.replace(replace, '');
		}
		return index;
	}

	Object.keys(map).forEach(function (k) {
		var index = getIndex(map[k]._path);

		if (map[k]._type === 'directory') {
			folders.push(map[k]);
			if (opts.type !== 'file' && !(opts.match || opts.ext)) {
				root[index] = map[k];
			}
		}
		if (map[k]._type === 'file' && (!opts.type || opts.type === 'file')) {
			root[index] = map[k];
		}
	});

	return folders;
}

function filterRecursive(folder, opts, returnArray) {
    var arr = filter(folder, opts, returnArray);

    filter(folder, {type: 'directory'}, true).forEach(function (f) {
        arr = arr.concat(filterRecursive(f, opts, returnArray));
    });

    return arr;
}

function extendComponents(folder, opts, callback) {
    if(typeof opts.extend.filter !== 'object') {
        callback(new TypeError('extend.filter must be an object'), folder);
        return;
    }
    if(typeof opts.extend.func !== 'function' && typeof opts.extend.props !== 'object') {
        callback(new TypeError('extend.func or extend.props must be defined'), folder);
        return;
    }
    if(typeof opts.extend.func !== 'function') {
        opts.extend.func = function (el) {
            utils.extend(el, opts.extend.props, true);
        };
    }
    folder.__filter(opts.extend.filter, true).forEach(opts.extend.func);
    callback(null, folder);
}

/**
 * Function for adding extra properties to a Folder object
 *
 * @param folder {Folder}
 */
function addMaping(folder) {
	Object.defineProperties(folder, {
		// Return all enumerable properties
		_subfiles: {
			get: function () {
                return filter(folder, {type: ['file','directory']}, 'keys');
            }
		},
		// Return properties with _type === 'file'
		_files: {
			get: function () {
                return filter(folder, {type: 'file'}, 'keys');
			}
		},
		// Return properties with _type === 'directory'
		_folders: {
			get: function () {
                return filter(folder, {type: 'directory'}, 'keys');
			}
		},
        __filter: {
            value: function (opts, returnArray) {
                if(!opts.recursive) {
                    return filter(folder, opts, returnArray);
                }
                opts.recursive = false;
                if(!returnArray) {
                    return filter(folder, opts, returnArray);
                }
                return filterRecursive(folder, opts, returnArray);
            }
        },
        __clear: {
            value: function () {
                folder._subfiles.forEach(function (key) {
                    delete folder[key];
                });
            }
        },
		// Function for starting mapping from current folder with opts
		__map: {
			value: function (opts, callback) {
				if (typeof opts === 'function') {
					callback = opts;
					opts = {};
				}

				folder.__list(function (err, list) {
					if (err) {
						callback(err);
						return;
					}
					mapObjects(folder, list, function (err, map) {
						if (err) {
							callback(err);
							return;
						}
						var folders = transfer(folder, map, opts);
						var count = folders.length;

						if (!opts.recursive || count === 0) {
                            if(!opts.extend) {
                                callback(null, folder);
                                return;
                            }

                            extendComponents(folder, opts, callback);
							return;
						}

						var sent = false;
						folders.forEach(function (f) {
							f.__map(opts, function (err, fMap) {
								if (err) {
									if (!sent) {
										callback(err);
										sent = true;
									}
									return;
								}
                                if (!opts.simple) {
                                    transfer(folder, fMap, opts);
                                }
								if (--count === 0) {
                                    if(!opts.extend) {
                                        callback(null, folder);
                                        return;
                                    }
                                    extendComponents(folder, opts, callback);
								}
							});
						});
					});
				});
			}
		},
        __reMap: {
            value: function (callback) {
                folder.__clear();
                folder.__map(callback);
            }
        },
        __watchMap: {
            value: function (persistent, callback) {
                if(typeof persistent === 'function') {
                    callback = persistent;
                    persistent = false;
                }
                folder.__watchList(persistent, function (err, list) {
                    if(err) {
                        callback(err);
                        return;
                    }
                    folder.__reMap(callback);
                });
            }
        },
        __extend: {
            value: function (map) {
                return utils.extend(folder, map, true);
            }
        }
	});
}

/**
 * Function for mapping simple first x lvls
 * @param map -> root map
 * @param lvls -> nr of levels
 * @param opts -> the options
 * @param type -> the final type to use
 * @param callback
 */
function simpleMap(map, lvls, opts, type, ext, callback) {
    opts = utils.clone(opts);
    lvls--;
    if(lvls < 1) {
        opts.simple = false;
        opts.recursive = true;
        opts.type = type;
        opts.ext = ext;
    }
    var folders = map.__filter({type:'directory'}, true);
    var count = folders.length;
    var errs = [];

    function end(err) {
        if(err) {
            errs.push(err);
        }
        if(--count !== 0) {
            return;
        }
        if(errs.length) {
            callback(errs);
            return;
        }
        callback(null, map);
    }
    folders.forEach(function (folder) {
        folder.__map(opts, function (err, fMap) {
            if(err) {
                end(err);
                return;
            }
            if(lvls < 1) {
                end();
            } else {
                simpleMap(fMap, lvls, opts, type, ext, end);
            }
        });
    });
}

/**
 * Function for mapping an array of folders and combining them
 * @param input -> array of objects
 * @param callback
 */
function mapWithArrayInput(input, callback) {
    var count = input.length;
    var errs = [];
    var maps = {};
    input.forEach(function (fOpts, index) {
        map(fOpts, function (err, fMap) {
            if(err) {
                errs.push(err);
            }
            maps[index] = fMap;
            if(--count === 0) {
                if(errs.length) {
                    callback(errs);
                    return;
                }
                var main = maps[0];
                var i = 1;
                while(maps[i]) {
                    main = main.__extend(maps[i]);
                    i++;
                }
                callback(null, main);
            }
        });
    });
}

/**
 * Function for mapping a folder and returning a foldermap
 * @param opts -> object or array of objects
 * @param callback
 */
function map(opts, callback) {
    if(utils.isArray(opts)) {
        mapWithArrayInput(opts, callback);
        return;
    }
    opts = normalize(opts);
    // Assume that the root is a folder
    var root = new fp.Folder(opts.path);

    var sent = false;
    root.__listen('error', function (err) {
        if (!sent) {
            callback(err);
            sent = false;
        }
    });
    root.__stats(function (err, stats) {
        if (err) {
            if (!sent) {
                callback(err);
            }
            return;
        }

        // If the root is a file simply return it
        if (!stats.isDirectory()) {
            callback(null, new fp.File(opts.path));
            return;
        }

        // Add functions
        addMaping(root);

        if(typeof opts.simple !== 'number' || !opts.recursive) {
            root.__map(opts, callback);
        } else {
            var lvls = opts.simple;
            var type = opts.type;
            var ext = opts.ext;
            opts.recursive = false;
            opts.simple = true;
            if(opts.type === 'file') {
                delete opts.type;
            }
            if(opts.ext) {
                delete opts.ext;
            }
            root.__map(opts, function (err, map) {
                if(err) {
                    callback(err);
                    return;
                }

                simpleMap(map, lvls, opts, type, ext, callback);
            });
        }
    });
}

// Expose the original map function
module.exports.map = map;

module.exports.FilePointer = fp;