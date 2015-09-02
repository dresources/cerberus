var hound = require('hound');
var targz = require('tar.gz');
var config = require('./config.json');
var path = require('path');
var glob = require('glob');

var devPath = process.cwd() + '/dev';
var stagingPath = process.cwd() + '/staging';
var extractPath;
var tarRegex = new RegExp(config.tarPattern);

startWatcher(devPath);
startWatcher(stagingPath);

function startWatcher(pathToWatch) {
    extractPath = glob.sync(pathToWatch + config.extractPathPattern);

    //check there is an extract path
    if (!extractPath.length) {
        console.error('no extract path found', pathToWatch);
        return;
    }

    //watch dev path
    console.log('watching', pathToWatch);
    hound.watch(pathToWatch)
        .on('create', extractTar)
        .on('change', extractTar)
}

function extractTar(file, stats) {
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
