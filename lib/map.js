'use strict';

var fp = require('file-pointer');
var fs = require('fs');
var path = require('path');

function normalize(opts) {
	if (typeof opts === 'string') {
		opts = {path: opts};
	}
	opts.path = path.resolve(opts.path);
	return opts;
}

module.exports.map = function (opts, callback) {
	opts = normalize(opts);
	console.log(opts);
	var root = new fp.Folder(opts.path);
	root.__stats(function (err, stats) {
		if (!stats.isDirectory()) {
			callback(null, new fp.File(opts.path));
			return;
		}
		addMaping(root);
		root.__map(opts, callback);
	});
};

function addMaping(folder) {
	Object.defineProperties(folder, {
		_subfiles: {
			get: function () { return Object.keys(folder); }
		},
		_files: {
			get: function () {
				return folder._subfiles.filter(function (f) {
					return (folder[f]._type === 'file');
				});
			}
		},
		_folders: {
			get: function () {
				return folder._subfiles.filter(function (f) {
					return (folder[f]._type === 'directory');
				});
			}
		},
		__map: {
			value: function (opts, callback) {
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

function transfer(root, map, opts) {
	map = filter(map, opts);
	var folders = [];
	Object.keys(map).forEach(function (k) {
		if (map[k]._type === 'directory') {
			folders.push(map[k]);
		}
		if (map[k]._type === 'file' || !(opts.type || opts.match)) {
			root[k] = map[k];
		}
	});

	return folders;
}

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

function filter(pObjects, opts) {
	var filtered = {};
	if (!opts.type && !opts.match) {
		return pObjects;
	}
	Object.keys(pObjects).forEach(function (key) {
		var add = false;
		if (opts.type) {
			add = (pObjects[key]._ext === opts.type);
		}
		if (opts.match) {
			add = !!(pObjects[key]._name.match(opts.match));
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