'use strict';
const path = require('path')
    , rimraf = require('rimraf')
    , mkdirp = require('mkdirp');

module.exports = {
    defaultOptions: require('../../src/core/defaults'),
    cleanBuild: function() {
        rimraf.sync(path.join(__dirname, '../build'));
    },
    tmpdir: function() {
        mkdirp.sync(path.join(__dirname, '../this/tmp/dir'));
    },
    cleanTmpdir: function() {
        rimraf.sync(path.join(__dirname, '../this/tmp/dir'));
    },
    TIMEOUT: 5000
};
