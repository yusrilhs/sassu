#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
    , fs = require('fs')
    , pkg = require('./package.json')
    , Sassu = require('./Sassu');

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
let sassu = new Sassu(args.dir);
