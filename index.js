#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
    , fs = require('fs')
    , path = require('path')
    , chalk = require('chalk')
    , stripJsonComments = require('strip-json-comments')
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

fs.readFile(sassurc, function(err, result) {
    let sassu;
    
    if (!err) {
        try {
            let optString = stripJsonComments(result.toString());
            let opts = JSON.parse(optString);
            sassu = new Sassu(args.dir, opts);
        } catch(error) {
            console.log(chalk.red(`Invalid configuration ${sassurc}\n${error}`));
            process.exit(1);
        }
    } else {
        sassu = new Sassu(args.dir);
    }

    sassu[args.task]();
});
