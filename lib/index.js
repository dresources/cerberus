var hound = require('hound');
var targz = require('tar.gz');
var path = require('path');
var glob = require('glob');
var fs = require('fs-extra');

var confPath = path.join(process.env.HOME, '/.cerberus/conf.d');

function _extractTar(pathToWatch, extractPath, tarRegex, file) {
    //check incase the directory was deleted since the watcher started
    if (!extractPath.length) {
        console.error('no extract path found', pathToWatch);
        return;
    }

    //if tar has been created, unpack it
    if (tarRegex.test(path.basename(file))) {
        console.log('extracting %s to %s', file, extractPath[0]);
        targz().extract(file, extractPath[0])
            .then(function() {
                console.log('extraction success');
            })
            .catch(function(err) {
                console.log('extraction error', err);
            });
    }
}

function _startWatcher(config, pathToWatch) {
    var extractPath = glob.sync(pathToWatch + config.extractPathPattern);
    var tarRegex = new RegExp(config.tarPattern);

    //check there is an extract path
    if (!extractPath.length) {
        console.error('no extract path found', pathToWatch);
        return;
    }

    console.log('watching', pathToWatch);

    //get all directories in pathToWatch
    var nestedDirectories = fs.readdirSync(pathToWatch).filter(function(file) {
        return fs.statSync(path.join(pathToWatch, file)).isDirectory();
    });

    var nestedPaths = nestedDirectories.map(function(directory) {
        return path.join(pathToWatch, directory);
    });

    //ignore nested directories
    console.log('ignoring', nestedPaths);
    var watcher = hound.watch(pathToWatch);
    watcher.unwatch(nestedPaths);

    //start watching
    watcher
        .on('create', _extractTar.bind(null, pathToWatch, extractPath, tarRegex))
        .on('change', _extractTar.bind(null, pathToWatch, extractPath, tarRegex));
}

module.exports = function() {
    console.log('woof');

    fs.ensureDirSync(confPath);

    var configFiles = fs.readdirSync(confPath);

    if (!configFiles.length) {
        console.error('no config files');
        return;
    }

    //loop config files
    console.log('config files to load', configFiles);
    configFiles.forEach(function(file) {
        //don't load in exmaple config
        if (file === 'example.json') {
            return;
        }

        var configFilePath = path.join(confPath, file);

        console.log('loading config', configFilePath);
        var config = require(configFilePath);
        var devPath = config.watch + '/dev';
        var stagingPath = config.watch + '/staging';

        _startWatcher(config, devPath);
        _startWatcher(config, stagingPath);
    });
};
