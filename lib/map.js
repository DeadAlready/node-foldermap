'use strict';

var fp = require('file-pointer');
var fs = require('fs');
var path = require('path');
var util = require('util');

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
		fp.create({filePath: name, parent: root}, function (err, obj) {
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
 * @returns {*} - object with filtered results
 */
function filter(pObjects, opts) {
	var filtered = {};
	if (!opts.type && !opts.match) {
		return pObjects;
	}
	Object.keys(pObjects).forEach(function (key) {
		var add = true;
		if (opts.ext) {
            if (util.isArray(opts.ext)) {
                add = add && (opts.ext.indexOf(pObjects[key]._ext) !== -1);
            } else {
                add = add && (pObjects[key]._ext === opts.ext);
            }
		}
		if (opts.match) {
			add = add && !!(pObjects[key]._name.match(opts.match));
		}
		if (pObjects[key]._name.charAt(0) === '.' && !opts.dotStart) {
			add = false;
		}
		if (opts.recursive && pObjects[key]._type === 'directory') {
			add = true;
		}
		if (add) {
			filtered[key] = pObjects[key];
		}
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
		var index = getIndex(k);

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

/**
 * Function for adding extra properties to a Folder object
 *
 * @param folder {Folder}
 */
function addMaping(folder) {
	Object.defineProperties(folder, {
		// Return all enumerable properties
		_subfiles: {
			get: function () { return Object.keys(folder); }
		},
		// Return properties with _type === 'file'
		_files: {
			get: function () {
				return folder._subfiles.filter(function (f) {
					return (folder[f]._type === 'file');
				});
			}
		},
		// Return properties with _type === 'directory'
		_folders: {
			get: function () {
				return folder._subfiles.filter(function (f) {
					return (folder[f]._type === 'directory');
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
							callback(null, folder);
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
								transfer(folder, fMap, opts);
								if (--count === 0) {
									callback(null, folder);
								}
							});
						});
					});
				});
			}
		}
	});
}


// Expose the original map function
module.exports.map = function (opts, callback) {
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

		// Map the folder
		addMaping(root);
		root.__map(opts, callback);
	});
};





