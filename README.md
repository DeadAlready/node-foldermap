[foldermap](https://github.com/DeadAlready/node-foldermap) is a simple folder mapper for node.

# Installation

    $ npm install foldermap

# Usage

foldermap expands the [file-pointer](https://github.com/DeadAlready/node-file-pointer) library
by assigning a few extra properties to file pointers and providing a map function

# Added properties

		_subfiles: [] // lists all enumerable properties of current object aka all files and folders attached
		_files: [] // lists only subfiles that are of type file
		_folders: [] // lists only subfiles that are of type folder

		__map: function (opts, callback) // provides the map function with current file being root
		__clear: function () // removes file and directory keys from the object
		__reMap: function (callback) // clears the map from files and folders and runs __map
		__watchMap: function ([persistent], callback) // watches for changes in folder and runs __reMap
		__filter: function (opts, [returnArray]) // filters the maps keys according to opts, returnArray can be boolean or 'keys' and will make the function return an array instead of an object

Like [file-pointer](https://github.com/DeadAlready/node-file-pointer) native properties, these are not enumerable.
For directories the files are added as enumerable properties

## Basic usage

As of v0.3 foldermap is only asynchronous

    //Async
    require('foldermap').map('./testFolder', function(err, map){
      console.log(map);
    });

## Advanced usage

Instead of path string you can also pass in an object or an array of objects with the following properties

* path - required, the string path of file
* ext - limit the files to have a specific extension
* type - ['file','directory'] - limit the subfiles to either type
* match - regular expression string to match filename against
* recursive - whether to traverse folders recursively, defaults to true
* relative - true or string, files are added to folder with relative paths
* simple - boolean or nr -> if true subfolders and files are not added to the main map, if numeric simple method will be used for the first x levels

### Example

    var map = require('foldermap').map({
      path:'./testFolder',
      recursive: false,
      ext: 'json'
    }, function (err, map) {
      console.log(map);
    });

## Map API

Foldermap will return a [file-pointer](https://github.com/DeadAlready/node-file-pointer) object of the folder or file with each
element having the corresponding [file-pointer](https://github.com/DeadAlready/node-file-pointer) convenience handles.

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