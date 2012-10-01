var path = require('path');

var mapper = require('../lib/map');
var vows = require('vows');
var spec = require('vows/lib/vows/reporters/spec');
var assert = require('assert');

var root = process.cwd() + path.sep + 'test' + path.sep;

var expected = {
  _type:'directory',
  _ext:'',
  _name:'testStructure',
  _base:'testStructure',
  _path: root + 'testStructure',
  _content: undefined,
  second:{
    _type:'directory',
    _ext:'',
    _name:'second',
    _base:'second',
    _path: root + 'testStructure' + path.sep + 'second',
    _content: undefined,
    'world.json':{
      _type:'file',
      _ext:'json',
      _name:'world.json',
      _base:'world',
      _path: root + 'testStructure' + path.sep + 'second' + path.sep + 'world.json',
      _content:'{"my":"World"}'
    }
  },
  'hello.js':{
    _type:'file',
    _ext:'js',
    _name:'hello.js',
    _base:'hello',
    _path: root + 'testStructure' + path.sep + 'hello.js',
    _content:'world'
  }
}

var expectedNoRecStar = {
  _type:'directory',
  _ext:'',
  _name:'testStructure',
  _base:'testStructure',
  _path: root + 'testStructure',
  _content: undefined,
  second:{
    _type:'directory',
    _ext:'',
    _name:'second',
    _base:'second',
    _path: root + 'testStructure' + path.sep + 'second',
    _content: undefined
  },
  'hello.js':{
    _type:'file',
    _ext:'js',
    _name:'hello.js',
    _base:'hello',
    _path: root + 'testStructure' + path.sep + 'hello.js',
    _content:'world'
  }
}

var expectedNoRec = {
  _type:'directory',
  _ext:'',
  _name:'testStructure',
  _base:'testStructure',
  _path: root + 'testStructure',
  _content: undefined
}

// Will test own properties only
function deepEqualWithDiff(a, e, names){
  var dif = {};
  var aKeys = Object.keys(a);
  var eKeys = Object.keys(e);

  var cKeys = aKeys;
  var dKeys = eKeys;
  var c = a;
  var d = e;
  var names = {
    c: names ? names['a'] : 'Actual',
    d: names ? names['e'] : 'Expected'
  }

  if(eKeys.length > aKeys.length){
    cKeys = eKeys;
    dKeys = aKeys;
    c = e;
    d = a;
    names = {
      d: names ? names['a'] : 'Actual',
      c: names ? names['e'] : 'Expected'
    }
  }


  for(var i = 0, co = cKeys.length; i < co; i++){
    var key = cKeys[i];
    if(typeof c[key] !== typeof d[key]){
      dif[key] = 'Type mismatch ' + names['c'] + ':' + typeof c[key] + '!==' + names['d'] + typeof d[key];
      continue;
    }
    if(typeof c[key] === 'function'){
      if(c[key].toString() !== d[key].toString()){
        dif[key] = 'Differing functions';
      }
      continue;
    }
    if(typeof c[key] === 'object'){
      if(c[key].length !== undefined){ // array
        var temp = c[key].slice(0);
        temp = temp.filter(function(el){
          return (d[key].indexOf(el) === -1);
        });
        var message = '';
        if(temp.length > 0){
          message += names['c'] + ' excess ' + JSON.stringify(temp);
        }

        temp = d[key].slice(0);
        temp = temp.filter(function(el){
          return (c[key].indexOf(el) === -1);
        });
        if(temp.length > 0){
          message += ' and ' + names['d'] + ' excess ' + JSON.stringify(temp);
        }
        if(message !== ''){
          dif[key] = message;
        }
        continue;
      }
      var diff = deepEqualWithDiff(c[key], d[key], {a:names['c'],e:names['d']});
      if(diff !== true && Object.keys(diff).length > 0){
        dif[key] = diff;
      }
      continue;
    }
    // Simple types left so
    if(c[key] !== d[key]){
      dif[key] = names['c'] + ':' + c[key] + ' !== ' + names['d'] + ':' + d[key]; 
    }
  }
  return Object.keys(dif).length > 0 ? dif : true;
}

function enumerableClone(o){
  var keys = Object.getOwnPropertyNames(o);
  var t = {};
  for(var i in keys){
    if(typeof o[keys[i]] === 'object' && o[keys[i]].length === undefined ){
      t[keys[i]] = enumerableClone(o[keys[i]]);
      continue;
    }
    t[keys[i]] = o[keys[i]];
  }
  return t;
}

vows.describe('Foldermap').addBatch({
  'MapTree recursively':{
    topic:function(){
      mapper.mapTree(root + 'testStructure', this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, deepEqualWithDiff(expected, enumerableClone(map)));
    }
  }
}).addBatch({
  'MapTree non recursive':{
    topic:function(){
      mapper.mapTree(root + 'testStructure', false, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, deepEqualWithDiff(expectedNoRec, enumerableClone(map)));
    }
  }
}).addBatch({
  'MapTree nonrecursive wildcard':{
    topic:function(){
      mapper.mapTree(root + 'testStructure' + path.sep + '*', false, this.callback);
    },
    'is correct':function(map){
      assert.strictEqual(true, deepEqualWithDiff(expectedNoRecStar, enumerableClone(map)));
    }
  }
}).addBatch({
  'MapTree sync recursive':{
    topic:function(){
      this.callback(null, mapper.mapTreeSync(root + 'testStructure'));
    },
    'is correct':function(map){
      assert.strictEqual(true, deepEqualWithDiff(expected, enumerableClone(map)));
    }
  }
}).addBatch({
  'MapTree sync nonrecursive':{
    topic:function(){
      this.callback(null, mapper.mapTreeSync(root + 'testStructure', false));
    },
    'is correct':function(map){
      assert.strictEqual(true, deepEqualWithDiff(expectedNoRec, enumerableClone(map)));
    }
  }
}).addBatch({
  'MapTree sync nonrecursive wildcard':{
    topic:function(){
      this.callback(null, mapper.mapTreeSync(root + 'testStructure' + path.sep + '*', false));
    },
    'is correct':function(map){
      assert.strictEqual(true, deepEqualWithDiff(expectedNoRecStar, enumerableClone(map)));
    }
  }
}).run({reporter:spec});
