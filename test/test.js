var path = require('path');

var mapper = require('../lib/map');

var root = process.cwd() + path.sep + 'test' + path.sep;

var expected = {
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


mapper.mapTree(root + 'testStructure', function(err, tree){
  if(err){
    throw err;
  }
  _areEqual(expected, map, 'Async');
});

var map = mapper.mapTreeSync(root + 'testStructure');
_areEqual(expected, map, 'Sync');

function _areEqual(a, b, message){
  if(typeof a !== typeof b){
    throw new Error(message + ' - FAILED');
  }
  
  if(typeof a === 'object'){
    for(var i in a){
      if(typeof a[i] === 'object'){
        _areEqual(a[i], b[i], message);
        continue;
      } 
      if(a[i] !== b[i]){
        throw new Error(message + ' - FAILED');
      }
    }
  } else {
    if(a !== b){
      throw new Error(message + ' - FAILED');
    }
  }
  console.log(message + ' - OK')
}
