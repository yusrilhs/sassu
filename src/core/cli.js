'use strict';

const fs = require('fs')
    , path = require('path')
    , yaml = require('js-yaml')
    , sassu = require('../sassu');

/**
 * Command line arguments
 * @param  {Object} args 
 * @return {Void}        
 */
module.exports = function(args) {
    let sassurc = path.join(process.cwd(), '.sassurc');
    fs.readFile(sassurc, 'utf-8', function(error, content) {
        // options
        let opts = {};

        // if `.sassurc` can be read
        if (!error) {
            try {
                opts = yaml.safeLoad(content, 'utf-8');
            } catch(err) {
                throw err;
            }
        }

        // Run sassu task
        sassu[args.task](args.dir, opts);
    });
};
