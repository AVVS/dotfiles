#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var argv = require('minimist')(process.argv.slice(2));
var spawn = require('child_process').spawn;
var path = require('path');
var filesToCopy = [
    '.npmignore',
    '.editorconfig',
    '.jshintrc',
    '_gitignore:.gitignore'
];

// project name
if (!argv._[0]) {
    throw new Error('project name must be specified');
}
var projectName = path.resolve(process.cwd(), argv._[0]);

fs.mkdirAsync(projectName, '0750')
    .catch(function error(err) {
        if (err.code === 'EEXIST') {
            return;
        } else {
            return Promise.reject(err);
        }
    })
    .then(function moveDotFiles() {
        return Promise.map(filesToCopy, function (file) {
            var from, dest, spl;
            spl = file.split(':');
            from = spl[0];
            dest = spl[1] || from;
            return new Promise(function (resolve, reject) {
                fs.createReadStream(path.resolve(__dirname, '../', from))
                    .on('error', reject)
                    .pipe(fs.createWriteStream(projectName + '/' + dest))
                    .on('error', reject)
                    .on('finish', resolve);
            });
        });
    })
    .then(function () {
        return new Promise(function (resolve, reject) {
            var child = spawn('npm', ['init'], {
                stdio: 'inherit',
                cwd: projectName
            });

            child.on('close', resolve);
            child.on('error', reject);
        });
    });
