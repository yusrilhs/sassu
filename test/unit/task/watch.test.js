'use strict';

const path = require('path')
    , fs = require('fs')
    , chai = require('chai')
    , should = chai.should()
    , watch = require('../../../src/task/watch')
    , utils = require('../utils');

describe('Test module src/task/watch.js', function() {
    before(function() {
        utils.cleanBuild();
        utils.tmpdir();
    });
    after(function() {
        utils.cleanBuild();
        utils.cleanTmpdir();
    });

    it('Should return watcher instance', function() {
        let mainFiles = [
                './test/scss/test1.scss',
                './test/scss/test2.scss'
            ],
            pattern = './test/**/*.scss',
            opts = utils.defaultOptions,
            postcssPlugins = [];

        let watcher = watch(mainFiles, pattern, opts, postcssPlugins);

        watcher.should.to.have.property('close');
        watcher.close.should.to.be.a('function');
        watcher.close();
    });
});
