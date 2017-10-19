'use strict';

const buildTask = require('./build')
    , DEFAULTS = require('../defaults');

/**
 * Watch sass task
 * @param  {String} workDir 
 * @param  {Object} opts    
 * @return {toThrough}      
 */
module.exports = function(workDir, opts) {
    // Set options
    opts = extend(DEFAULTS, opts);
    
};
