var chokidar = require('chokidar');
var targz = require('tar.gz');
var path = require('path');
var glob = require('glob');
var fs = require('fs-extra');

var confPath = path.join(process.env.HOME, '/.cerberus/conf.d');

function _extractTar(pathToWatch, extractPath, tarRegex, file) {
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
        .on('add', _extractTar.bind(null, pathToWatch, extractPath, tarRegex))
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
