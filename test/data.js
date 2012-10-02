/* 
 * Copyright 2012 Karl Düüna <karl.dyyna@gmail.com> All rights reserved.
 */
'use strict';

var utils = require('./utils');
var path = require('path');
var root = process.cwd() + path.sep + 'test' + path.sep;

function clone(o){
  var c = {};
  var h = Object.keys(o);
  for(var i = 0, co = h.length; i < co; i++){
    c[h[i]] = o[h[i]];
  }
  return c;
}

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

var third = {
  _type:'directory',
  _ext:'',
  _name:'third',
  _base:'third',
  _path: root + 'testStructure' + path.sep + 'second' + path.sep + 'third',
  _content: undefined
}

var hello2 = {
  _type:'file',
  _ext:'js',
  _name:'hello.js',
  _base:'hello',
  _path: root + 'testStructure' + path.sep + 'second' + path.sep + 'third' + path.sep + 'hello.js',
  _content:'world'
}

var secondW = clone(second);
secondW['world.json'] = world;

var secondWN = clone(secondW);

var thirdW = clone(third);
thirdW['hello.js'] = hello2;

secondW.third = thirdW;

var e = clone(testStructure);
e.second = secondW;
e['hello.js'] = hello;

module.exports.e = e;

var NoRecStar = clone(testStructure);
NoRecStar.second = second;
NoRecStar['hello.js'] = hello;

module.exports.NoRecStar = NoRecStar;

module.exports.NoRec = clone(testStructure);

module.exports.List = {
  second: secondW,
  'hello.js':hello
};

module.exports.Object = {
  sec: second,
  hel:hello
};

module.exports.ListNoRec = {
  second:second,
  'hello.js':hello
}

var Json = clone(testStructure);
Json.second = secondWN;
module.exports.Json = Json;

var Js = clone(testStructure);
Js['hello.js'] = hello;
Js.second = clone(second);
Js.second.third = thirdW;

module.exports.Js = Js;
