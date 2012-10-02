/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var utils = require('./utils');
var path = require('path');
var root = process.cwd() + path.sep + 'test' + path.sep;

var testStructure = {
  _type:'directory',
  _ext:'',
  _name:'testStructure',
  _base:'testStructure',
  _path: root + 'testStructure',
  _content: undefined
}

var second = {
  _type:'directory',
  _ext:'',
  _name:'second',
  _base:'second',
  _path: root + 'testStructure' + path.sep + 'second',
  _content: undefined
}

var world = {
  _type:'file',
  _ext:'json',
  _name:'world.json',
  _base:'world',
  _path: root + 'testStructure' + path.sep + 'second' + path.sep + 'world.json',
  _content:'{"my":"World"}'
}

var hello = {
  _type:'file',
  _ext:'js',
  _name:'hello.js',
  _base:'hello',
  _path: root + 'testStructure' + path.sep + 'hello.js',
  _content:'world'
}

var secondW = utils.enumerableClone(second);
secondW['world.json'] = world;

var expected = utils.enumerableClone(testStructure);
expected.second = secondW;
expected['hello.js'] = hello;

module.exports.expected = expected;

var expectedNoRecStar = utils.enumerableClone(testStructure);
expectedNoRecStar.second = second;
expectedNoRecStar['hello.js'] = hello;

module.exports.expectedNoRecStar = expectedNoRecStar;

module.exports.expectedNoRec = utils.enumerableClone(testStructure);

var expectedList = {
  second: secondW,
  'hello.js':hello
}

module.exports.expectedList = expectedList;

var expectedObject = {
  sec: secondW,
  'hel':hello
}

module.exports.expectedObject = expectedObject;

module.exports.expectedListNoRec = {
  second:second,
  'hello.js':hello
}