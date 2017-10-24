'use strict';

const gulpSourcemaps = require('gulp-sourcemaps')
    , vfs = require('vinyl-fs')
    , extend = require('extend')
    , gulpPostcss = require('gulp-postcss')
    , DEFAULTS = require('../core/defaults')
    , buildSass = require('../core/build-sass')
    , utils = require('../core/utils')
    , log = utils.log
    , logError = utils.logError;

/**
 * Build Sass tasks
 * @param   {Array}     files 
 * @param   {Object}    opts
 * @param   {Array}     postcssPlugins
 * @return  {stream}
 */
module.exports = function(files, opts, postcssPlugins) {
    log('Starting build task');
    // Set options
    opts = extend(DEFAULTS, opts);
    // Set postcssPlugins
    postcssPlugins = postcssPlugins || [];

    // Filter for sass and scss only
    let stream = vfs.src(files)
        .pipe(gulpSourcemaps.init())
        .pipe(buildSass(opts).on('error', logError));
    
    if (postcssPlugins.length) {
        stream.pipe(gulpPostcss(postcssPlugins));
    }

    return stream
            .pipe(gulpSourcemaps.write('.'))
            .pipe(vfs.dest(opts.dest));
};
