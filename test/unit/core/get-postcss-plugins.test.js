'use strict';

const chai = require('chai')
    , should = chai.should()
    , utils = require('../utils')
    , getPostcssPlugins = require('../../../src/core/get-postcss-plugins');

describe('Test module src/core/get-postcss-plugins.js', function() {

    it('Should return an empty array', function() {
        utils.defaultOptions.autoprefixer = false;
        utils.defaultOptions.flexbugs_fixes = false;
        utils.defaultOptions.oldie = false;
        
        let plugins = getPostcssPlugins(utils.defaultOptions);

        plugins.should.to.be.an('array');
        plugins.should.to.be.empty;
    });

    it('Should return a supported postcss plugins', function() {
        utils.defaultOptions.autoprefixer = {
            browsers: ['last 2 versions']
        };
        utils.defaultOptions.flexbugs_fixes = true;
        utils.defaultOptions.oldie = true;

        let plugins = getPostcssPlugins(utils.defaultOptions);

        plugins.should.to.have.lengthOf(3);
    });

});
