'use strict';

const chai = require('chai')
    , should = chai.should()
    , sassu = require('../../src/sassu');

describe('Test module src/sassu.js', function() {

    it('Should have 2 property', function() {
        Object.keys(sassu).should.to.have.lengthOf(2);
    });

    it('Should all property is a function', function() {
        sassu.build.should.be.a('function');
        sassu.watch.should.be.a('function');
    });
});
