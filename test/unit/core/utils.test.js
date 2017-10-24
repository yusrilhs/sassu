'use strict';

const chai = require('chai')
    , should = chai.should()
    , utils = require('../../../src/core/utils');

describe('Test module src/core/utils.js', function() {

    it('Should have 2 property', function() {
        Object.keys(utils).should.to.have.lengthOf(2);
    });

    it('Should all property is a function', function() {
        utils.log.should.be.a('function');
        utils.logError.should.be.a('function');
    });
});
