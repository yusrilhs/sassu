'use strict';

const path = require('path')
    , vfs = require('vinyl-fs');

/**
 * Filter only sass and scss files to compile sass
 * @param   {Object}        opts
 * @return  {stream}       
 */
module.exports = function(opts) {
    // Sass and scss files pattern
    let patterns = [
        path.join(opts.workDir, '/**/*.scss'),
        path.join(opts.workDir, '/**/*.sass')
    ];

    // Return stream
    return vfs.src(patterns);
};
