'use strict';

var fs = require('fs');
var fM = require('../lib/map');

fM.map('./files', function (err, map) {
    console.log(map);
    map.myprop = 'hello';
    map.__watchMap(function (err, map2) {
        console.log('map changed', arguments);
    });
    setTimeout(function () {
        map.__add('test.txt', 'testing', function(err, file) {
            setTimeout(function () {
                file.__write('lollus');
            }, 1000);
            setTimeout(function () {
                file.__delete();
            }, 5000);

        });
    }, 1000);

    setTimeout(function () {
        console.log(map);
        process.exit();
    }, 10000);
});