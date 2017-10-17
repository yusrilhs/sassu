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
    indentWidth: 2,
    linefeed: 'lf',
    outputStyles: {
        compressed: true,
        expanded: true
    },
    outputExtnames: {
        compressed: '.min.css',
        expanded: '.css'
    },
    outputSourcemaps: {
        compressed: true
    },
    precision: 5,
    sourceComments: false,
    sourceMapContents: false,
    sourceMapEmbed: false,
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
    this.eventEmitter.on(evt, cb);
};

/**
 * Remove listener event
 * @param  {String}   evt 
 * @return {Void}         
 */
Sassu.prototype.removeListener = function(evt) {
    this.eventEmitter.removeListener(evt);
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
    if (this.opts.outputSourcemaps[outputStyle]) {
        option.sourceMap = replaceExt(option.outFile, '.map');
        option.sourceMapContents = this.opts.sourceMapContents;
        option.sourceMapEmbed = this.opts.sourceMapEmbed;
    }

    return option;
};

/**
 * Build Sass files
 * @param  {Array} files 
 * @return {Void}        
 */
Sassu.prototype.buildSass = function(files) {
    // Sassu instance
    let sassu = this;
    
    // Make directory for output destination  
    this.__outputDir__ = path.join(process.cwd(), sassu.opts.dest);
    
    try {
        mkdirp.sync(this.__outputDir__);
    } catch(error) {
        logError(error);
        return;
    } 
    
    log('Building sass files');

    // Promise array
    // let promiseArray = [];

    files.forEach(function(file) {
        // Tracking error reported
        let errorReported = false;
        // Loop each output
        for (let outputStyle in sassu.opts.outputStyles) {

            let nSassOpts = sassu.getOutputOption(outputStyle, file);

            log(`Build ${chalk.bold(outputStyle)} ${chalk.cyan(cleanCwdStr(file) + ' > ' + cleanCwdStr(nSassOpts.outFile))}`);

            // Start render sass
            let result = sass.render(nSassOpts, function(errSass, result) {
                if (!errSass) {
                    let css = result.css.toString();

                    let postCssPlugins = [];

                    // Add flexbugs fixes plugins
                    postCssPlugins.push(require('postcss-flexbugs-fixes'));

                    // If oldie is set
                    if (sassu.opts.oldie) {
                        postCssPlugins.push(require('oldie')(sassu.opts.oldie));
                    }

                    // If autoprefixer is set
                    if (sassu.opts.autoprefixer) {
                        postCssPlugins.push(require('autoprefixer')({add: false, browsers: []}));
                    }

                    let cleaner = postCss(postCssPlugins);
                    
                    cleaner
                        .process(css)
                        .then(function(cleaned) {
                            // is using autoprefixer?
                            return (sassu.opts.autoprefixer) ? 
                                    postCss([require('autoprefixer')]).process(cleaned.css) :
                                    cleaned.css;
                        }).then(function(cleaned) {
                            // Is result not from autoprefixer?
                            let cssContent = (typeof cleaned == 'string') ?
                                                cleaned : cleaned.css;
                            sassu
                                .writeFile(nSassOpts.outFile, cssContent, sassu.opts.encoding)
                                .catch(logError);
                            
                            // If sourcemaps defined
                            if  (sassu.opts.outputSourcemaps[outputStyle]) {
                                let map = result.map.toString();
                                        
                                log(`Starting write sourcemap at ${chalk.cyan(cleanCwdStr(nSassOpts.outFile) + '.map')}`);

                                sassu
                                    .writeFile(nSassOpts.outFile + '.map', map, sassu.opts.encoding)
                                    .catch(logError);      
                            }
                        });
                    
                } else {
                    if (!errorReported) {
                        // Error will be pad because time log
                        logError(errSass.formatted.replace(/\n/g, '\n' + ' '.repeat(11)));
                        // Set it to true 
                        // cause that can be multiple error reported
                        errorReported = true;
                    }
                }
            });
        }
    });
};

/**
 * Write file
 * @param  {String}   filePath 
 * @param  {String}   fileContent 
 * @param  {String}   encoding 
 * @return {Promise}                
 */
Sassu.prototype.writeFile = function(filePath, fileContent, encoding) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(filePath, fileContent, encoding, function(err) {
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
        sassu.buildSass(files);
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
};

module.exports = Sassu;
