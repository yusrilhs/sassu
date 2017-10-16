const chai = require('chai')
    , expect = chai.expect
    , chaiProcess = require('@evolopment/chai-process')
    , chaiAsPromised = require('chai-as-promised')
    , Sassu = require('../Sassu');

chai.use(chaiProcess);
chai.use(chaiAsPromised);

let spawn = chaiProcess.spawn;

describe('Test Sassu.js', function() {

    it('Should create new Sassu instance', function() {
        expect(new Sassu('./test/scss')).to.be.an.instanceof(Sassu);
    });

    it('Should return exit code 1 while directory doesn\'t exists', function() {
        expect(spawn('node', ['../index.js', 'build', './test/maybe/scss'])).to.eventually.fail;
        expect(spawn('node', ['../index.js', 'build', './test/maybe/scss'])).to.eventually.exitCode.eql(1);
    });

});
