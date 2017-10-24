'use strict';

const path = require('path')
    , sass = require('node-sass')
    , chalk = require('chalk')
    , through2 = require('through2')
    , replaceExt = require('replace-ext')
    , File = require('vinyl')
    , applySourceMap = require('vinyl-sourcemaps-apply')
    , utils = require('./utils')
    , getOutputOptions = require('./get-output-options')
    , log = utils.log
    , logError = utils.logError;

/**
 * Build Sass
 * @param  {Object} opts 
 * @return {stream}      
 */
module.exports = function(opts) {
    // Starting build
    log(chalk.bold('Building sass files'));

    return through2.obj(function(file, enc, cb) {
        // Promise Array for track render node-sass async
        let promiseArray = [];

        let stream = this;

        // Is Null
        if (file.isNull()) {
            return cb(null, file);
        }

        // Ensure file must file without `_` at first
        if (path.basename(file.path).charAt(0) == '_') {
            return cb();
        }
        
        // Grab the path portion of the file that's being worked on
        let sassFileSrcPath = path.dirname(file.relative);

        // Re-use output options
        if (!file.outputOptions) {
            file.outputOptions = {};
        }    

        for (let outputStyle in opts.outputStyles) {
            // Don't include this outputStyle?
            if (!outputStyle) continue;

            // Grab output option for build sass
            let outputOption = file.outputOptions[outputStyle] ? 
                                file.outputOptions[outputStyle] : 
                                getOutputOptions(outputStyle, file, opts);

            // Is a blank file?
            if (!file.contents.length) {
                file.path = replaceExt(file.path, outputOption.ext);
                stream.push(file);
                continue;
            }

            log(`Building ${chalk.cyan(file.relative)} ${chalk.bold(outputStyle)}`);

            // Render sass as promise
            let sassPromised = new Promise(function(resolve, reject) {
                sass.render(outputOption, function(err, result) {
                    if (err) {
                        return reject(err);
                    } else {
                        
                        log(`Finished build ${chalk.cyan(file.relative)} ${chalk.bold(outputStyle)}`);

                        // create new css file
                        let cssFile = new File({
                            base: path.dirname(file.path),
                            path: replaceExt(file.path, outputOption.ext),
                            contents: result.css
                        });

                        // is have sourcemaps?
                        if (result.map) {
                            // Modified from gulp-sass
                            
                            // Re-format sourcemap into JSON
                            let sourceMap = JSON.parse(result.map.toString());
                            // Grab the stdout and transform it into stdin
                            let sourceMapFile = sourceMap.file.replace(/^stdout$/, 'stdin');

                            if (sassFileSrcPath) {
                                // Prepend the path to all files in the sources array except the file that's being worked on
                                let sourceFileIndex = sourceMap.sources.indexOf(sourceMapFile);
                                sourceMap.sources = sourceMap.sources.filter(function(source, index) {
                                    return (index === sourceFileIndex) ? source : path.join(sassFileSrcPath, source);
                                });
                            }
                            // Remove 'stdin' from souces and replace with filenames!
                            sourceMap.sources = sourceMap.sources.filter(function(src) {
                                if (src !== 'stdin') return src;
                            });
                            // Replace the map file with the original file name
                            sourceMap.file = replaceExt(cssFile.relative, outputOption.ext);
                            applySourceMap(cssFile, sourceMap);
                        }

                        // Push into file vinyl
                        stream.push(cssFile);

                        return resolve();
                    }
                });
            });

            // Add Sass promised to promiseArray
            promiseArray.push(sassPromised);
        }

        // Handle all promised sass.render
        Promise.all(promiseArray)
               .then(function() {
                    cb();
               })
               .catch(function(err) {
                    stream.emit('error', err.formatted.replace(/\n/g, '\n' + ' '.repeat(11)));
               });
    });
};
