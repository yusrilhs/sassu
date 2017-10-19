'use strict';

const path = require('path');

/**
 * Get output option for build sass
 * @param  {String} outputStyle 
 * @param  {String} file        
 * @return {Object}             
 */
module.exports = function(outputStyle, file, opts) {
    let option = {
        includePaths: opts.includePaths,
        indentType: opts.indentType,
        indentedSyntax: opts.indentedSyntax,
        indentWidth: opts.indentWidth,
        linefeed: opts.lineWidth,
        outputStyle: outputStyle,
        precision: opts.indentType,
        sourceComments: opts.sourceComments
    };
    
    // Set file for build
    option.file = file.path;

    // Set sass content
    option.data = file.contents.toString();

    // Make sure .sass file indentedSyntax true
    if (path.extname(file.path) == '.sass') {
        option.indentedSyntax = true;
    }

    // File extension for output
    option.ext = opts.outputExtnames[outputStyle] ?
                    opts.outputExtnames[outputStyle] : '.css';

    // Source map options
    if (opts.outputSourcemaps[outputStyle]) {
        option.sourceMap = file.path;
        option.omitSourceMapUrl = true;
        option.sourceMapContents = true;
    }

    return option;
};
