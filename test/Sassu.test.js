'use strict';

const chai = require('chai')
    , should = chai.should()
    , spawn = require('child_process').spawn
    , rimraf = require('rimraf')
    , mkdirp = require('mkdirp')
    , chaiProcess = require('@evolopment/chai-process')
    , chaiAsPromised = require('chai-as-promised')
    , chaiFs = require('chai-fs')
    , fs = require('fs')
    , Sassu = require('../Sassu');

chai.use(chaiProcess);
chai.use(chaiFs);
chai.use(chaiAsPromised);

let chaiProcessSpawn = chaiProcess.spawn;

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

    describe('Test Module Sassu.js', function() {

        it('Should create new Sassu instance', function() {
            let sassu = new Sassu('./test/scss'); 
            sassu.should.to.be.an.instanceof(Sassu);
            sassu.should.to.have.property('workDir');
            sassu.should.to.have.property('opts');
        }); 

        it('Should find Sass files on directory with no `_` at first', function() {
            let sassu = new Sassu('./test/scss');
            
            sassu.filterFiles(function(files) {
                files.should.to.have.lengthOf(2);
            });
        });

        it('Should directory exists on ./test/build', function() {
            let sassu = new Sassu('./test/scss', {
                dest: './test/build'
            });

            sassu.prepareBuild();

            './test/build'.should.be.a.directory().and.empty;
        });

        it('Should return option for build', function() {
            let sassu = new Sassu('./test/scss', {
                dest: './test/build'
            });

            sassu.prepareBuild();
            
            let optScss = sassu.getOutputOption('compressed', 'test/scss/file.scss');
            let optSass = sassu.getOutputOption('compressed', 'test/scss/file.sass');

            optScss.should.to.not.equal(optSass);
            optScss.indentedSyntax.should.to.be.false;
            optSass.indentedSyntax.should.to.be.true;
        });

        it('Should fulfilled write file on directory ./test/build', function() {
            let sassu = new Sassu('./test/scss');
            
            mkdirp.sync('./test/build');

            sassu.writeFile('./test/build/test_write', 'Test Write', 'utf-8')
                 .should.be.fulfilled;
        });

        it('Should rejected while write file on directory ./test/build because read only', function() {
            let sassu = new Sassu('./test/scss');
            
            mkdirp.sync('./test/build', {
                mode: 666
            });

            sassu.writeFile('./test/build/test_write', 'Test Write', 'utf-8')
                 .should.be.rejected;
        });

        it('Should have 2 files on directory ./test/build', function(done) {
            let sassu = new Sassu('./test/scss', {
                dest: './test/build',
                includePaths: [
                    './test/includes'
                ],
                outputStyles: {
                    expanded: true,
                    compressed: false
                }
            });

            sassu.on('finished_build', function() {
                './test/build'.should.to.be.a.directory().with.contents([
                    'test1.css',
                    'test2.css'
                ]);
                done();
            });

            sassu.build();
        });
    });

    describe('Test Sassu command line', function() {
        it('Should return exit code 1 while directory doesn\'t exists', function() {
            this.timeout(10000);
            return chaiProcessSpawn('node', ['index.js', 'build', './scss']).should.to.eventually.exitCode.eql(1);
        });

        it('Should return exit code 0 while directory is exists', function() {
            this.timeout(10000);
            return chaiProcessSpawn('node', ['index.js', 'build', './test/scss']).should.to.eventually.exitCode.eql(0);
        });

        it('Should have 6 files on directory test/build', function(done) {
            this.timeout(10000);
            chaiProcessSpawn('node', ['index.js', 'build', './test/scss'])
                .should.be.fulfilled.then(testFileContent)
                .should.notify(done);
        });

        it('Should close after CTRL+C on watch task', function(done) {
            this.timeout(10000);
            let child = spawn('node', ['index.js', 'watch', './test/scss']);

            child.on('close', done);

            child.kill('SIGINT');
        });
    });
});
