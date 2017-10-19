'use strict';

/**
 * Default options for sassu
 * @type {Object}
 */
module.exports = {
    dest: 'dist',
    includePaths: [],
    indentType: 'space',
    indentedSyntax: false,
    indentWidth: 2,
    linefeed: 'lf',
    outputStyles: {
        compressed: true
    },
    outputExtnames: {
        compressed: '.min.css'
    },
    outputSourcemaps: {
        compressed: true
    },
    precision: 5,
    sourceComments: false,
    autoprefixer: false,
    oldie: false
};
