var path = require('path');

var mapper = require('../lib/map');
var utils = require('./utils');
var data = require('./data');
var vows = require('vows');
var spec = require('vows/lib/vows/reporters/spec');
var assert = require('assert');

var root = process.cwd() + path.sep + 'test' + path.sep;

vows.describe('Foldermap').addBatch({
  'Map recursively':{
    topic:function(){
      mapper.map(root + 'testStructure', this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expected, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map non recursive':{
    topic:function(){
      mapper.map(root + 'testStructure', false, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedNoRec, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map nonrecursive wildcard':{
    topic:function(){
      mapper.map(root + 'testStructure' + path.sep + '*', false, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedNoRecStar, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map list':{
    topic:function(){
      mapper.map([root + 'testStructure' + path.sep + 'second',root + 'testStructure' + path.sep + 'hello.js'], this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedList, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map list non rec':{
    topic:function(){
      mapper.map([root + 'testStructure' + path.sep + 'second',root + 'testStructure' + path.sep + 'hello.js'], false, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedListNoRec, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map object':{
    topic:function(){
      mapper.map({
        'sec':root + 'testStructure' + path.sep + 'second',
        'hel':root + 'testStructure' + path.sep + 'hello.js'
      }, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedObject, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map sync recursive':{
    topic:function(){
      this.callback(null, mapper.mapSync(root + 'testStructure'));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expected, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map sync nonrecursive':{
    topic:function(){
      this.callback(null, mapper.mapSync(root + 'testStructure', false));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedNoRec, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map sync nonrecursive wildcard':{
    topic:function(){
      this.callback(null, mapper.mapSync(root + 'testStructure' + path.sep + '*', false));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedNoRecStar, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map list sync':{
    topic:function(){
      this.callback(null, mapper.mapSync([root + 'testStructure' + path.sep + 'second',root + 'testStructure' + path.sep + 'hello.js']));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedList, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map list sync non recursive':{
    topic:function(){
      this.callback(null, mapper.mapSync([root + 'testStructure' + path.sep + 'second',root + 'testStructure' + path.sep + 'hello.js'], false));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedListNoRec, utils.enumerableClone(map)));
    }
  }
}).addBatch({
  'Map object sync':{
    topic:function(){
      this.callback(null, mapper.mapSync({
        'sec':root + 'testStructure' + path.sep + 'second',
        'hel':root + 'testStructure' + path.sep + 'hello.js'
      }));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepEqualWithDiff(data.expectedObject, utils.enumerableClone(map)));
    }
  }
}).run({reporter:spec});
