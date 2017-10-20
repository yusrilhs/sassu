'use strict';

const gulpSourcemaps = require('gulp-sourcemaps')
    , vfs = require('vinyl-fs')
    , extend = require('extend')
    , DEFAULTS = require('../core/defaults')
    , filterFiles = require('../core/filter-files')
    , buildSass = require('../core/build-sass')
    , log = require('../core/utils').log;

/**
 * Build Sass tasks
 * @param   {String} workDir 
 * @param   {Object} opt
 * @return  {stream}
 */
module.exports = function(workDir, opts) {
    log('Starting build task');
    // Set options
    opts = extend(DEFAULTS, opts);
    
    // Set working directory
    opts.workDir = workDir;
    
    // Filter for sass and scss only
    return filterFiles(opts)
        .pipe(gulpSourcemaps.init())
        .pipe(buildSass(opts))
        .pipe(gulpSourcemaps.write('.'))
        .pipe(vfs.dest(opts.dest));
};
