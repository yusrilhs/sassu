'use strict';

const gulpSourcemaps = require('gulp-sourcemaps')
    , vfs = require('vinyl-fs')
    , extend = require('extend')
    , DEFAULTS = require('../defaults')
    , filterFiles = require('../filter-files')
    , buildSass = require('../build-sass')
    , log = require('../utils').log;

/**
 * Build Sass tasks
 * @param   {Object} opt
 * @return  {Void}
 */
module.exports = function(workDir, opts) {
    log('Starting build task');
    // Set options
    opts = extend(DEFAULTS, opts);

    // Set working directory
    opts.workDir = workDir;
    
    // Filter for sass and scss only
    filterFiles(opts)
        .pipe(gulpSourcemaps.init())
        .pipe(buildSass(opts))
        .pipe(gulpSourcemaps.write('.'))
        .pipe(vfs.dest(opts.dest));
};
