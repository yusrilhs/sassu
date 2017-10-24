'use strict';

const gulpSourcemaps = require('gulp-sourcemaps')
    , vfs = require('vinyl-fs')
    , extend = require('extend')
    , DEFAULTS = require('../core/defaults')
    , buildSass = require('../core/build-sass')
    , utils = require('../core/utils')
    , log = utils.log
    , logError = utils.logError;

/**
 * Build Sass tasks
 * @param   {Array}     files 
 * @param   {Object}    opts
 * @return  {stream}
 */
module.exports = function(files, opts) {
    // Postcss plugins
    let plugins = [];

    log('Starting build task');
    // Set options
    opts = extend(DEFAULTS, opts);

    // Filter for sass and scss only
    return vfs.src(files)
        .pipe(gulpSourcemaps.init())
        .pipe(buildSass(opts).on('error', logError))
        .pipe(gulpSourcemaps.write('.'))
        .pipe(vfs.dest(opts.dest));
};
