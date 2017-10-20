'use strict';

const buildTask = require('./build')
    , DEFAULTS = require('../core/defaults');

/**
 * Watch sass task
 * @param  {String} workDir 
 * @param  {Object} opts    
 * @return {Void}      
 */
module.exports = function(workDir, opts) {
    // Set options
    opts = extend(DEFAULTS, opts);
    
};
