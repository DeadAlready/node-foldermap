'use strict';

var util = require('util');

module.exports = util;


/**
 * Function for creating a clone of an object
 *
 * @param o {Object}  object to clone
 * @return {Object}
 */
function clone(obj) {
    if (typeof obj !== 'object') {
        return obj;
    }
    var ret;
    if (util.isArray(obj)) {
        ret = [];
        obj.forEach(function (val) {
            ret.push(clone(val));
        });
        return ret;
    }
    ret = {};
    Object.keys(obj).forEach(function (key) {
        ret[key] = clone(obj[key]);
    });
    return ret;
}

/**
 * A extends B
 *
 * util.inherits works only with objects derived from Object
 *
 * @return {Object} Extended object
 */
function extend(a, b, noClone) { // A extends B
    a = a || {};

    if (typeof a !== 'object') {
        return noClone ? b : clone(b);
    }

    if (typeof b !== 'object') {
        return b;
    }

    if (!noClone) {
        a = clone(a);
    }

    Object.keys(b).forEach(function (key) {
        if (!a.hasOwnProperty(key) ||
            (!(typeof b[key] === 'object' && b[key].length === undefined && b[key].constructor.name === 'Folder') &&
                (typeof b[key] !== 'function'))) { // Simple types
            a[key] = b[key];
        } else { // Complex types
            a[key] = extend(a[key], b[key], noClone);
        }
    });
    return a;
}

module.exports.clone = clone;
module.exports.extend = extend;