var chokidar = require('chokidar');
var targz = require('tar.gz');
var path = require('path');
var glob = require('glob');
var fs = require('fs-extra');
var pkg = require('../package.json');

var confPath = path.join(process.env.HOME, '/.cerberus/conf.d');

function _extractTar(pathToWatch, extractPathPattern, tarRegex, file) {
    //update extractPath in case it's changed since the watcher started
    var extractPath = glob.sync(pathToWatch + extractPathPattern);

    console.log('%s has been added', file);

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
                fs.unlinkSync(file);
                console.log('%s deleted', file);
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

    //ignore nested directories
    var watcher = chokidar.watch(pathToWatch, {
        depth: 0, // don't go into subdirs
        ignoreInitial: true // stop it running on startup
    });

    //start watching
    watcher
        .on('change', _extractTar.bind(null, pathToWatch, config.extractPathPattern, tarRegex));
}

module.exports = function() {
    console.log('Cerberus', pkg.version);
    console.log('---------------------');

    if (process.env.NODE_ENV === 'development') {
        confPath = __dirname + '/../test';
    }

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

        config.environments.forEach(function(environment) {
            var envPath = path.join(config.watch, environment.dirName);
            _startWatcher(config, envPath);
        });
    });
};
