[foldermap](https://github.com/DeadAlready/node-foldermap) is a simple folder mapper for node.

# Installation

    $ npm install foldermap

# Usage

foldermap traverses the folders in a given path and maps them into objects with the following properties:

    {
      _name: //Filename with extension
      _base: //Filename without extension
      _ext:  //Extension
      _type: //'file' or 'directory'
      _path: //Full path to the file
      _content: //Handle to access file content or undefined in case of directory
    }

Those properties are not enumerable. For directories the files are added as enumerable properties
with _name being the key

## Basic usage

    //Async
    require('foldermap').map('./testFolder', function(err, map){
      console.log(map);
    });
    //Sync
    var map = require('foldermap').mapSync('./testFolder');

## Advanced usage

Instead of path string you can also pass in an object or an array of objects with the following properties

* path - required, the string path of file
* type - limit the files to have a specific extension
* match - regular expression string to match filename against
* recursive - whether to traverse folders recursively, defaults to true
* name - the name used for the property if file is in a list

### Example

    var map = require('foldermap').mapSync([{
      path:'./testFolder',
      recursive: false,
      type: 'json'
    },{
      path:'./testFolder2',
      recursive: false,
      type: 'json',
      name: 'test2'
    }]);

## License

The MIT License (MIT)
Copyright (c) 2012 Karl Düüna

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.