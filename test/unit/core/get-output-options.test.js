'use strict';

const chai = require('chai')
    , File = require('vinyl')
    , should = chai.should()
    , utils = require('../utils')
    , getOutputOptions = require('../../../src/core/get-output-options');

describe('Test module src/core/get-output-options.js', function() {

    it('Should return different indentedSyntax options', function() {
        utils.defaultOptions.indentedSyntax = false;

        let sassFile = new File({
                    path: './test/files/my-file.sass',
                    contents: new Buffer('$x: 123;')
                }), 
            scssFile = new File({
                    path: './test/files/my-file.scss',
                    contents: new Buffer('$x: 123;')
                });

        let optionsSass = getOutputOptions('compressed', sassFile, utils.defaultOptions), 
            optionsScss = getOutputOptions('compressed', scssFile, utils.defaultOptions);

        optionsSass.should.to.have.property('indentedSyntax', true);
        optionsScss.should.to.have.property('indentedSyntax', false);
    });

    it('Should return .css extension if output extension not specified', function() {
        let file = new File({
                    path: './test/files/my-file.scss',
                    contents: new Buffer('$x: 123;')
                });

        let optionsCompressed = getOutputOptions('compressed', file, utils.defaultOptions),
            optionsExpanded = getOutputOptions('expanded', file, utils.defaultOptions);

        optionsCompressed.should.to.have.property('ext', '.min.css');
        optionsExpanded.should.to.have.property('ext', '.css');
    });

});
