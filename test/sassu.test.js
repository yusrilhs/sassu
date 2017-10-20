'use strict';

const chai = require('chai')
    , should = chai.should()
    , spawn = require('child_process').spawn
    , rimraf = require('rimraf')
    , mkdirp = require('mkdirp')
    , through2 = require('through2')
    , fs = require('fs')
    , sassu = require('../src/sassu');

/**
 * Clean build directory
 * @return {Void}
 */
function clean() {
    rimraf.sync('./test/build');
}

/**
 * Test file with content
 * @return {Void}
 */
function testFileContent() {
    './test/build'.should.to.be.a.directory().with.contents([
        'test1.css',
        'test1.min.css',
        'test1.min.css.map',
        'test2.css',
        'test2.min.css',
        'test2.min.css.map',
    ]);
}

describe('Test Sassu', function() {

    beforeEach(clean);

    afterEach(clean);

    describe('Test Module src/sassu.js', function() {
        it('Should have watch method', function() {
            sassu.should.to.have.property('watch');
            sassu.build.should.to.be.a('function');
        });

        it('Should have build method', function() {
            sassu.should.to.have.property('build');
            sassu.build.should.to.be.a('function');
        });

        it('Should build method return a stream', function(done) {
            let stream = sassu.build('./test/scss', {
                dest: './test/build',
                includePaths: [
                    './test/includes'
                ]
            });

            stream.on('error', done)
                  .on('end', done);
        });
    });
});
