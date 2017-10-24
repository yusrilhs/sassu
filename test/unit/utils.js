'use strict';
const path = require('path')
    , rimraf = require('rimraf');

module.exports = {
    defaultOptions: require('../../src/core/defaults'),
    cleanBuild: function() {
        rimraf.sync(path.join(__dirname, '../build'));
    }
};
