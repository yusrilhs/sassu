'use strict';

const buildTask = require('./build')
    , path = require('path')
    , chalk = require('chalk')
    , sassGraph = require('sass-graph')
    , extend = require('extend')
    , chokidar = require('chokidar')
    , DEFAULTS = require('../core/defaults')
    , log = require('../core/utils').log;

/**
 * Watch sass task
 * @param  {Array}  mainFiles
 * @param  {String} pattern 
 * @param  {Object} opts
 * @param  {Array}     postcssPlugins    
 * @return {Void}      
 */
module.exports = function(mainFiles, pattern, opts, postcssPlugins) {
    // Set options
    opts = extend(DEFAULTS, opts);

    // Initialize watcher
    let watcher = chokidar.watch(pattern, {
        ignored: [
            /(^|[\/\\])\../,
            /node_modules.*\.(scss|sass)/,      // ignore node_modules
            /bower_components.*\.(scss|sass)/   // ignore bower_components
        ],
        persistent: true
    });

    let graphs = [];

    function findGraphIndex(file) {
        let ret = -1;

        for(let i=0,len=graphs.length;i<len;i++) {
            if (Object.keys(graphs[i].index).indexOf(file) !== -1) {
                ret = i;
                break;
            }
        }

        return ret;
    }

    for(let i=0,len=mainFiles.length;i<len;i++) {
        let graph = sassGraph.parseFile(mainFiles[i], {
            loadPaths: opts.includePaths
        });

        graphs.push(graph);
    }

    watcher.on('add', function(file) {
        log(`${chalk.green(path.relative(process.cwd(), file))} added into watch task`);
        if (path.basename(file).charAt(0) !== '_' && findGraphIndex(file) === -1) {
            let graph = sassGraph.parseFile(file, {
                loadPaths: opts.includePaths
            });

            graphs.push(graph);
        }
    });

    watcher.on('change', function(file) {
        let files = [];

        if (path.basename(file).charAt(0) === '_') {
            for(let i=0,len=graphs.length;i<len;i++) {
                if (Object.keys(graphs[i].index).indexOf(file) === -1) continue;

                // Build only main files
                graphs[i].visitAncestors(file, function(parent) {
                    if (path.basename(parent).charAt(0) !== '_') {
                        files.push(parent);
                    }
                });
            }
        } else {
            // Refresh sass graph
            graphs[findGraphIndex(file)] = sassGraph.parseFile(file, {
                loadPaths: opts.includePaths
            });

            files.push(file);
        }
        
        buildTask(file, opts, postcssPlugins);
    });
};
