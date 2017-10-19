#!/usr/bin/env node
'use strict';

const ArgumentParser = require('argparse').ArgumentParser
    , fs = require('fs')
    , path = require('path')
    , chalk = require('chalk')
    , yaml = require('js-yaml')
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

let sassurc = path.join(process.cwd(), '.sassurc');
fs.readFile(sassurc, 'utf-8', function(error, content) {
    let sassu;
    if (error) {
        sassu = new Sassu(args.dir);
        sassu[args.task]();
    } else {
        try {
            let opts = yaml.safeLoad(content, 'utf-8');
            sassu = new Sassu(args.dir, opts);
            sassu[args.task]();
        } catch(err) {
            console.log(chalk.red(err));
        }
    }
    
});


