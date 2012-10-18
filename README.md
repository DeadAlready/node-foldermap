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
      
      //These properties are only assigned for files
      _content: //Handle to access file content synchronously.
      
      //These are functions that exist only on files
      _read: //Handle for reading file contents
      _write: //Handle for writing file contents
      
      //These are functions that are assigned for directory's only
      _add: //Function for adding subfolders or files
      
      //These are functions that are assigned for both files and folders
      _delete: //Handle for deleting the file or folder(with all subfolders and files)
    }

Those properties are not enumerable. For directories the files are added as enumerable properties
with _name being the key

## Basic usage

The foldermap function execution depends on the input arguments, 
if map receives a function as the second argument the mapping is executed 
asynchronously and callback is called with (err, map), 
if no callback is provided then the function is executed synchronously returning the map
or throwing an error if one occurs

    //Async
    require('foldermap').map('./testFolder', function(err, map){
      console.log(map);
    });
    //Sync
    var map = require('foldermap').map('./testFolder');

## Advanced usage

Instead of path string you can also pass in an object or an array of objects with the following properties

* path - required, the string path of file
* type - limit the files to have a specific extension
* match - regular expression string to match filename against
* recursive - whether to traverse folders recursively, defaults to true
* name - the name used for the property if file is in a list

### Example

    var map = require('foldermap').map([{
      path:'./testFolder',
      recursive: false,
      type: 'json'
    },{
      path:'./testFolder2',
      recursive: false,
      type: 'json',
      name: 'test2'
    }]);

## Map API

Foldermap will return an map object of the folder with each 
element having several convenience handles for access.

### _name

Filename with extension

### _base

Filename without extension

### _path

Full path to file

### _ext

File extension. For example for config.json it would return json 

### _type

'file' or 'directory'

### _content

_content is a special property allowing access to file contents. It only exists on file objects.
 
The following lines are equal.

    var c = map.file._content;
    // is the same as
    var c = require('fs').readFileSync(map.file._path,'utf8');

Writing is also possible.

    map.file._content = 'Hello';
    // is the same as
    require('fs').writeFileSync(map.file._path,'Hello','utf8');

### _read()

_read is a function that allows to read the file contents. Unlike the _content property, 
_read also allows to read the contents asynchronously or get access to the readStream object.

If a callback is provided for the _read function then the file contents are 
read asynchronously and returned to the callback.

    map.file._read(function(err, contents){
      console.log(contents);
    });

If no callback is provided then a readstream object is returned

    var stream = map.file._read();
    stream.on('data',function(data){
      //Here we get data
    });

### _write()

_write is analogous to _read. It allows to write the contents of the file async or get the writeStream object.
The function takes up to 2 arguments -> content, callback

If only the content is provided, then it works the same as using _content property

    map.file._write('Hello');
    // is the same as
    map.file._content = 'Hello';

If the callback is also provided then the file write will occur async. In async mode the content input can also be a buffer.

    map.file._write('Hello',function(err){
      if(!err){
        console.log('Successfully written');
      }
    });

If no arguments are provided then a writeStream object is returned.

    var stream = map.file._write();
    stream.write('Hello');

### _delete()

_delete function allows the deletion of files and folders. 
It acts differently depending on the object in question.

#### Files

Optional callback can be provided determining whether the function is ran sync or async.

    map.file._delete(); // Synchronous

    map.file._delete(function(err){
      if(!err){
        console.log('File deleted');
      }
    });

#### Folders

Optional callback and force parameter can be provided. 

Force parameter will determine if the subfolders and files are deleted. Default is false.
If the folder is not empty and this parameter is not specified or specified as false then an error is either returned or thrown.

Callback will determine if the function is ran sync or async.

Examples

    map.folder._delete(); // Synchronous without content deletion
    map.folder._delete(true); // Synchronous with content deletion
    
    // Async non recursive
    map.folder._delete(function(err){
      if(!err){
        console.log('Folder deleted');
      }
    });

    // Async recursive
    map.folder._delete(true, function(err){
      if(!err){
        console.log('Folder deleted');
      }
    });

### _add()

The _add function exists only on folders and can be used to add files or folders to the directory structure. 
The added files and folders are automatically mapped and added to the object.

The _add function has the following arguments

+ filePath: required //String or object determining the add path and type. - 
If filePath is string then the file type is file. 
As an object the filePath supports the .path and .type properties, where .type can be 'directory' or 'file'
+ content: optional //The contents of the file added. - This parameter has no effect when adding a directory.
+ callback: optional //Callback to invoke with the results. - Will determine if function runs sync or async


    // Examples
    // Calling with content will return the handle to the newly created file object
    var hello = map.folder._add('test.txt','Hello');
    // or
    map.folder._add('test.txt','Hello',function(err, hello){
      if(err){
      // Something went wrong
      }
    });
    // Hello will equal to map.folder['test.txt']
    
    //Calling without content will return the writeStream object for the newly created file.
    var stream = map.folder._add('test2.txt');
    // or
    map.folder._add('test2.txt',function(err, stream){
      if(err){
      // Something went wrong
      }
    });
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