'use strict';

const buildTask = require('./core/task/build')
    , watchTask = require('./core/task/watch');

/**
 * Export task
 * @type {Object}
 */
module.exports = {
    build: buildTask,
    watch: watchTask
};
