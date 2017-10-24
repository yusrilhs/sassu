'use strict';

const autoprefixer = require('autoprefixer')
    , flexbugsFixes = require('postcss-flexbugs-fixes')
    , oldie = require('oldie');

function toObj(p) {
    return typeof p === 'object' ? p : {};
}

/**
 * Get postcss plugins
 * @param  {Object} opts 
 * @return {Array}       
 */
module.exports = function(opts) {
    let plugins = [];

    // If use flexbugs fixes
    if (opts.flexbugs_fixes) {
        plugins.push(flexbugsFixes(toObj(opts.flexbugs_fixes)));
    }

    // If use oldie
    if (opts.oldie) {
        plugins.push(oldie(toObj(opts.oldie)));
    }

    // If use autoprefixer
    if (opts.autoprefixer) {
        plugins.push(autoprefixer(toObj(opts.autoprefixer)));
    }

    return plugins;
};
