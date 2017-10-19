#!/usr/bin/env node
'use strict';

const ArgumentParser = require('argparse').ArgumentParser
    , fs = require('fs')
    , path = require('path')
    , chalk = require('chalk')
    , yaml = require('js-yaml')
    , sassuCli = require('./src/core/cli')
    , logError = require('./src/core/utils').logError
    , pkg = require('./package.json');

// Initialize parser
let parser = new ArgumentParser({
    version: pkg.version,
    addHelp: true,
    description: `${pkg.name} - ${pkg.description}`
});

// Task arguments
parser.addArgument(
    ['task'],
    {
        choices: ['build', 'watch'],
        help: 'Task to execute'
    }
);

// Directory arguments
parser.addArgument(
    ['dir'],
    {
        help: 'Directory of Sass files which want to'
    }
);

let args = parser.parseArgs();

try {
    // Trying to run sassu cli
    sassuCli(parser.parseArgs());
} catch(error) {
    logError(error);
    process.exit(1);
}


