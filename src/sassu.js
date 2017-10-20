'use strict';

const buildTask = require('./task/build')
    , watchTask = require('./task/watch');

/**
 * Export task
 * @type {Object}
 */
module.exports = {
    build: buildTask,
    watch: watchTask
};
