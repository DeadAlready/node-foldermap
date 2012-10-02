var path = require('path');

var mapper = require('../lib/map');
var utils = require('./utils');
var expected = require('./data');
var vows = require('vows');
var spec = require('vows/lib/vows/reporters/spec');
var assert = require('assert');

var root = process.cwd() + path.sep + 'test' + path.sep;

vows.describe('Foldermap').addBatch({
  'Map string':{
    topic:function(){
      mapper.map(root + 'testStructure', this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.e));
    }
  }
}).addBatch({
  'Map object':{
    topic:function(){
      mapper.map({path: root + 'testStructure'}, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.e));
    }
  }
}).addBatch({
  'Map nonrecursive':{
    topic:function(){
      mapper.map({path:root + 'testStructure',recursive:false}, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.NoRec));
    }
  }
}).addBatch({
  'Map non recursive list':{
    topic:function(){
      mapper.map([{
          path:root + 'testStructure' + path.sep + 'second',
          recursive:false
        },{
          path:root + 'testStructure' + path.sep + 'hello.js',
          recursive:false
        }], this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.ListNoRec));
    }
  }
}).addBatch({
  'Map type json':{
    topic:function(){
      mapper.map({
          path: root + 'testStructure',
          type: 'json'
        }, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.Json));
    }
  }
}).addBatch({
  'Map type js':{
    topic:function(){
      mapper.map({
          path: root + 'testStructure',
          type: 'js'
        }, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.Js));
    }
  }
}).addBatch({
  'Map list with names':{
    topic:function(){
      mapper.map([{
          path: root + 'testStructure' + path.sep + 'second',
          recursive: false,
          name:'sec'
        },{
          path: root + 'testStructure' + path.sep + 'hello.js',
          recursive: false,
          name:'hel'
        }], this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.Object));
    }
  }
}).addBatch({
  'Map sync string':{
    topic:function(){
      this.callback(null, mapper.mapSync(root + 'testStructure'));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.e));
    }
  }
}).addBatch({
  'Map sync object':{
    topic:function(){
      this.callback(null, mapper.mapSync({path:root + 'testStructure'}));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.e));
    }
  }
}).addBatch({
  'Map sync object non recursive':{
    topic:function(){
      this.callback(null, mapper.mapSync({path:root + 'testStructure', recursive:false}));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.NoRec));
    }
  }
}).addBatch({
  'Map sync non recursive list':{
    topic:function(){
      this.callback(null, mapper.mapSync([{
          path:root + 'testStructure' + path.sep + 'second',
          recursive:false
        },{
          path:root + 'testStructure' + path.sep + 'hello.js',
          recursive:false
        }]));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.ListNoRec));
    }
  }
}).addBatch({
  'Map sync type json':{
    topic:function(){
      this.callback(null, mapper.mapSync({
          path: root + 'testStructure',
          type: 'json'
        }));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.Json));
    }
  }
}).addBatch({
  'Map sync type js':{
    topic:function(){
      this.callback(null, mapper.mapSync({
          path: root + 'testStructure',
          type: 'js'
        }));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.Js));
    }
  }
}).addBatch({
  'Map sync list with names':{
    topic:function(){
      this.callback(null, mapper.mapSync([{
          path: root + 'testStructure' + path.sep + 'second',
          recursive: false,
          name:'sec'
        },{
          path: root + 'testStructure' + path.sep + 'hello.js',
          recursive: false,
          name:'hel'
        }]));
    },
    'is correct':function(map){
      assert.strictEqual(true, utils.deepDiff(utils.eClone(map), expected.Object));
    }
  }
}).run({reporter:spec});
