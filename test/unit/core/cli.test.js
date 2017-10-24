'use strict';

const chai = require('chai')
    , chaiFs = require('chai-fs')
    , os = require('os')
    , should = chai.should()
    , cli = require('../../../src/core/cli')
    , utils = require('../utils');

chai.use(chaiFs);

describe('Test module src/core/cli.js', function() {
    
    before(utils.tmpdir);
    after(utils.cleanTmpdir);

    describe('Test generate configuration file', function() {

        it('Should throw an error if directory doesn\'t exists', function() {
            let args = {
                genConfig: './test/unexists/directory'
            };
            (function() { cli(args); }).should.to.throw();
        });

        it('Should not write configuration file while exists', function() {
            let args = {
                genConfig: true
            };
            (function() { cli(args); }).should.to.throw();
        });

        it('Should write configuration file while not exists', function() {
            let args = {
                genConfig: './test/this/tmp/dir'  
            };

            (function() { cli(args); }).should.to.not.throw();
            './test/this/tmp/dir/.sassurc'.should.be.a.path();
        });
    });

    describe('Test build task', function() {
        
        before(utils.cleanBuild);
        after(utils.cleanBuild);

        it('Should throw an error while sass file doesn\'t exists', function() {
            let args = {
                build: './test/unexists/file.scss'
            };
            (function() { cli(args) }).should.to.throw();
        });

        it('Should throw an error while input file is unsupported', function() {
            let args = {
                build: './test/file.css'
            };
            (function() { cli(args) }).should.to.throw();
        });

        it('Should have 6 files in directory', function(done) {
            let args = {
                build: './test/scss',
                config: './test'
            };
            
            
            Promise.resolve(cli(args)).then(function() {
                setTimeout(function() {
                    './test/build'.should.to.be.a.directory().with.contents([
                        'test1.css',
                        'test1.min.css',
                        'test1.min.css.map',
                        'test2.css',
                        'test2.min.css',
                        'test2.min.css.map',
                    ]);
                    done();
                }, 1000); // Simulate 1 second build finished
            }).catch(done); 
        });
    });

    describe('Test watch task', function() {
        before(utils.cleanBuild);
        after(function() {
            utils.cleanBuild();
        });

        it('Should throw an error while sass file doesn\'t exists', function() {
            let args = {
                watch: './test/unexists/file.scss'
            };
            (function() { cli(args) }).should.to.throw();
        });

        it('Should throw an error while input file is unsupported', function() {
            let args = {
                watch: './test/file.css'
            };
            (function() { cli(args) }).should.to.throw();
        });
    });
});
