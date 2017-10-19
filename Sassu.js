'use strict';

const path = require('path')
    , fs = require('fs')
    , chalk = require('chalk')
    , events = require('events')
    , globby = require('globby')
    , replaceExt = require('replace-ext')
    , extend = require('extend')
    , mkdirp = require('mkdirp')
    , postCss = require('postcss')
    , autoprefixer = require('autoprefixer')
    , oldie = require('oldie')
    , flexbugFixes = require('postcss-flexbugs-fixes')
    , watch = require('node-watch')
    , sass = require('node-sass');

/**
 * Add zero to single digits
 * @param  {Integer} number 
 * @return {String}         
 */
function padZero(number) {
    return (number < 0 || number > 9 ? "" : "0") + number;
}

/**
 * Get current time with format hh:mm:ss
 * @return {String}
 */
function currentTime() {
    let dt = new Date();
    return `${padZero(dt.getHours())}:${padZero(dt.getMinutes())}:${padZero(dt.getSeconds())}`;
}

/**
 * Colored current time for command line
 * @return {String}
 */
function currentTimeLog() {
    return `[${chalk.gray(currentTime())}]`;
}

/**
 * Log output
 * @param  {String} str 
 * @return {Void}       
 */
let log = function(str) {
    console.log(`${currentTimeLog()} ${str}`);
}

/**
 * Error log output
 * @param  {String} str 
 * @return {Void}       
 */
let logError = function(str) {
    console.error(`${currentTimeLog()} ${chalk.red(str)}`);
}

/**
 * Clean cwd from path
 * @param  {String} filepath 
 * @return {String}      
 */
function cleanCwdStr(filepath) {
    return filepath.replace(process.cwd(), '').substr(1);
}

// Silent while test module
if (process.env.NODE_ENV == 'test') {
    log = function() {};
    logError = function() {};
}

/**
 * Sassu base class
 * @param  {String} workDir 
 * @param  {Object} opts    
 */
const Sassu = function(workDir, opts) {
    this.workDir = path.join(process.cwd(), workDir);
    
    // Exit if work directory doesn't exists
    if (!fs.existsSync(this.workDir)) {
        logError(`${this.workDir} doesn't exists`);
        process.exit(1);
    }

    this.opts = extend(Sassu.DEFAULT_OPTIONS, opts);
    // Event emitter
    this.eventEmitter = new events.EventEmitter();
};

/**
 * Default Configuration of Sassu
 * @type {Object}
 */
Sassu.DEFAULT_OPTIONS = {
    dest: 'dist',
    encoding: 'utf-8',
    includePaths: [],
    indentType: 'space',
    indentedSyntax: false,
    indentWidth: 2,
    linefeed: 'lf',
    outputStyles: {
        compressed: true
    },
    outputExtnames: {
        compressed: '.min.css'
    },
    outputSourcemaps: {
        compressed: true
    },
    precision: 5,
    sourceComments: false,
    autoprefixer: null,
    oldie: null
};

/**
 * Build Sass Utility
 * @return {Void}
 */
Sassu.prototype.build = function() {
    // Sassu instance
    let sassu = this;

    log('Starting build task');
    
    // Filter main files first
    sassu.filterFiles(function(files) {
        sassu.prepareBuild();
        sassu.buildSass(files);
    });
};

/**
 * Register listener event
 * @param  {String}   evt 
 * @param  {Function} cb  
 * @return {Void}         
 */
Sassu.prototype.on = function(evt, cb) {
    this.eventEmitter.addListener(evt, cb);
};

/**
 * Filter main files only to compile sass
 * @param  {Function} cb 
 * @return {Void}       
 */
Sassu.prototype.filterFiles = function(cb) {
    // Sass and scss files pattern
    let patterns = [
        path.join(this.workDir, '/**/*.scss'),
        path.join(this.workDir, '/**/*.sass')
    ];

    // Filter main file only to do node-sass
    globby(patterns).then(function(paths) {
        var files = paths.filter(function(file) {
            return path.basename(file).charAt(0) !== '_';
        });

        log(`founded ${files.length} sass main files`);
        // Callback with main files
        cb(files);
    });
};

/**
 * Get output option for build sass
 * @param  {String} outputStyle 
 * @param  {String} file        
 * @return {Object}             
 */
Sassu.prototype.getOutputOption = function(outputStyle, file) {
    let option = {
        includePaths: this.opts.includePaths,
        indentType: this.opts.indentType,
        indentedSyntax: this.opts.indentedSyntax,
        indentWidth: this.opts.indentWidth,
        linefeed: this.opts.lineWidth,
        outputStyle: outputStyle,
        precision: this.opts.indentType,
        sourceComments: this.opts.sourceComments
    };
    
    // Set file for build
    option.file = file;

    // Make sure .sass file indentedSyntax true
    if (path.extname(file) == '.sass') {
        option.indentedSyntax = true;
    }

    let basename = path.basename(file);

    // Outfile options
    option.outFile = (this.opts.outputExtnames[outputStyle]) ?  
                            replaceExt(path.join(this.__outputDir__, basename), this.opts.outputExtnames[outputStyle]) :
                            replaceExt(path.join(this.__outputDir__, basename), '.css');

    // SourceMap options
    option.sourceMap = this.opts.outputSourcemaps[outputStyle];

    return option;
};

/**
 * Prepare build 
 * @return {Void}
 */
Sassu.prototype.prepareBuild = function() {
    // Make directory for output destination  
    if (!this.__outputDir__) {
        this.__outputDir__ = path.join(process.cwd(), this.opts.dest);

        // Create directory only 1 time
        try {
            mkdirp.sync(this.__outputDir__);
        } catch(error) {
            logError(error);
            return;
        } 
    }

    // For reuse option
    // This will reduce time for build
    if (!this.__fileOptions) {
        this.__fileOptions = {};
    }
}

/**
 * Build Sass files
 * @param  {Array} files 
 * @return {Void}        
 */
Sassu.prototype.buildSass = function(files) {
    // Time logging
    let timeStart = new Date();

    // Sassu instance
    let sassu = this;

    log(chalk.bold('Building sass files'));

    // Promise array
    // This for track builds
    let promiseArray = [];
    
    files.forEach(function(file) {
        // Tracking error reported
        let errorReported = false;
        // Loop each output
        for (let outputStyle in sassu.opts.outputStyles) {
            
            // If not this output style
            if (!sassu.opts.outputStyles[outputStyle]) continue;
            
            sassu.__fileOptions[file + outputStyle] = (sassu.__fileOptions[file + outputStyle]) ?
                            sassu.__fileOptions[file + outputStyle] : sassu.getOutputOption(outputStyle, file);

            log(`Build ${chalk.bold(outputStyle)} ${chalk.cyan(cleanCwdStr(file) + ' > ' + cleanCwdStr(sassu.__fileOptions[file + outputStyle].outFile))}`);

            // Start render sass
            promiseArray.push(new Promise(function(resolve, reject) {
                sass.render(sassu.__fileOptions[file + outputStyle], function(errSass, result) {
                    if (errSass) {
                        if (!errorReported) {
                            errorReported = true;
                            reject(errSass.formatted.replace(/\n/g, '\n' + ' '.repeat(11)));
                        }
                    } else {
                        resolve(result);
                    }
                });
            }).then(function(result) {
                let css = result.css.toString();

                if (!sassu.__fileOptions[file + outputStyle]['postcss']) {
                    sassu.__fileOptions[file + outputStyle]['postcss'] = [];
                    
                    // Add flexbugs fixes plugins
                    sassu.__fileOptions[file + outputStyle]['postcss'].push(flexbugFixes);

                    // If oldie is set
                    if (sassu.opts.oldie) {
                        sassu.__fileOptions[file + outputStyle]['postcss'].push(oldie(sassu.opts.oldie));
                    }

                    // If autoprefixer is set
                    if (sassu.opts.autoprefixer) {
                        sassu.__fileOptions[file + outputStyle]['postcss'].push(autoprefixer({add: false, browsers: []}));
                    }
                };

                // For sourcemaps
                // because postcss will break the sourcemaps definition on css files
                if (!sassu.__fileOptions[file + outputStyle]['postcss_process']) {
                    sassu.__fileOptions[file + outputStyle]['postcss_process'] = result.map ? {
                        map: { annotation: false },
                        from: sassu.__fileOptions[file + outputStyle].file,
                        to: sassu.__fileOptions[file + outputStyle].outFile
                    } : {};
                }

                return postCss(sassu.__fileOptions[file + outputStyle]['postcss']).process(css, sassu.__fileOptions[file + outputStyle]['postcss_process']);
            }).then(function(cleaned) {
                // is using autoprefixer?
                return (sassu.opts.autoprefixer) ? 
                        postCss([autoprefixer(sassu.opts.autoprefixer)]).process(cleaned.css, sassu.__fileOptions[file + outputStyle]['postcss_process']) :
                        cleaned;
            }).then(function(cleaned) {
                log(`Starting write ${chalk.cyan(cleanCwdStr(sassu.__fileOptions[file + outputStyle].outFile))}`);

                return sassu.writeFile(sassu.__fileOptions[file + outputStyle].outFile, cleaned.css)
                            .then(function() {
                                return cleaned.map;
                            });                     
            }).then(function(map) {
                // If sourcemaps defined
                if  (map) {        
                    log(`Starting write sourcemap at ${chalk.cyan(cleanCwdStr(sassu.__fileOptions[file + outputStyle].outFile) + '.map')}`);

                    return sassu.writeFile(sassu.__fileOptions[file + outputStyle].outFile + '.map', JSON.stringify(map));      
                }
            }));
        }
    });

    Promise.all(promiseArray)
        .then(function() { 
            log(chalk.bold('Build finished after ') + chalk.bold.blue(`${new Date() - timeStart}ms`));

            sassu.eventEmitter.emit('finished_build');            
        }).catch(function(err) {
            logError(err);
            sassu.eventEmitter.emit('finished_build');
        });
};

/**
 * Write file
 * @param  {String}   filePath 
 * @param  {String}   fileContent 
 * @param  {String}   encoding 
 * @return {Promise}                
 */
Sassu.prototype.writeFile = function(filePath, fileContent) {
    let sassu = this;
    return new Promise(function(resolve, reject) {
        fs.writeFile(filePath, fileContent, sassu.opts.encoding, function(err) {
            if (err) {
                return reject(new Error(err));
            } else {
                log(`Finished write ${chalk.green(cleanCwdStr(filePath))}`);
                return resolve();
            }
        }); 
    });
};

/**
 * Watch sass files
 * @return {Void}
 */
Sassu.prototype.watch = function() {
    // Sassu instance
    let sassu = this;

    log('Starting watch task');

    sassu.filterFiles(function(files) {
        sassu.prepareBuild();
        sassu.buildSass(files);
        
        sassu.eventEmitter.once('finished_build', function() {
            // Watch after build finished
            log(`Watching: ${chalk.blue(sassu.workDir)}`);
            
            let watcher = watch(sassu.workDir, {
                recursive: true,
                filter: /\.(scss|sass)$/ // Watch only sass or scss files
            });

            watcher.on('change', function(evt, name) {
                log(`${chalk.cyan(cleanCwdStr(name))} ${chalk.yellow('changed')}`);
                sassu.buildSass(files);
            });

            watcher.on('error', function(err) {
                logError(err);
            });

            process.on('SIGINT', watcher.close);
        });
    });
};

module.exports = Sassu;
