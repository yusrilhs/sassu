const path = require('path')
    , fs = require('fs')
    , chalk = require('chalk')
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
function log(str) {
    console.log(`${currentTimeLog()} ${str}`);
}

/**
 * Error log output
 * @param  {String} str 
 * @return {Void}       
 */
function logError(str) {
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

    log('Starting Sassu');
};

/**
 * Default Configuration of Sassu
 * @type {Object}
 */
Sassu.DEFAULT_OPTIONS = {
    dest: '',
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
 * Build Sass files
 * @param  {Array} files 
 * @return {Void}        
 */
Sassu.prototype.buildSass = function(files) {
    // Sassu instance
    let sassu = this;
    
    // Make directory for output destination  
    let outputDir = path.join(process.cwd(), sassu.opts.dest);
    try {
        mkdirp.sync(outputDir);
    } catch(error) {
        logError(error);
        return;
    } 
    
    log('Building sass files');

    files.forEach(function(file) {
        // Tracking error reported
        let errorReported = false;
        // Loop each output
        for (let outputStyle in sassu.opts.outputStyles) {

            let nodeSassOptions = {
                includePaths: sassu.opts.includePaths,
                indentType: sassu.opts.indentType,
                indentWidth: sassu.opts.indentWidth,
                linefeed: sassu.opts.lineWidth,
                outputStyle: outputStyle,
                precision: sassu.opts.indentType,
                sourceComments: sassu.opts.sourceComments
            };

            // Set file for build
            nodeSassOptions.file = file;

            // Make sure .sass file indentedSyntax true
            if (path.extname(file) == '.sass') {
                nodeSassOptions.indentedSyntax = true;
            }

            let basename = path.basename(file);

            // Outfile options
            nodeSassOptions.outFile = (sassu.opts.outputExtnames[outputStyle]) ?  
                                    replaceExt(path.join(outputDir, basename), sassu.opts.outputExtnames[outputStyle]) :
                                    replaceExt(path.join(outputDir, basename), '.css');

            // SourceMap options
            if (sassu.opts.outputSourcemaps[outputStyle]) {
                nodeSassOptions.sourceMap = replaceExt(nodeSassOptions.outFile, '.map');
                nodeSassOptions.sourceMapContents = sassu.opts.sourceMapContents;
                nodeSassOptions.sourceMapEmbed = sassu.opts.sourceMapEmbed;
            }

            log(`Build ${chalk.bold(outputStyle)} ${chalk.cyan(cleanCwdStr(file) + ' > ' + cleanCwdStr(nodeSassOptions.outFile))}`);

            
            let result = sass.render(nodeSassOptions, function(errSass, result) {
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
                        }).then(function(result) {
                            // Is result not from autoprefixer?
                            let cssContent = (typeof result == 'string') ?
                                                result : result.css;
                            
                            fs.writeFile(nodeSassOptions.outFile, cssContent, sassu.opts.encoding, function(err) {
                                if (!err) {
                                    log(`Finished build ${chalk.bold(outputStyle)} ${chalk.green(cleanCwdStr(nodeSassOptions.outFile))}`);
                                } else {
                                    logError(err);
                                }
                            });
                        });
                    
                    // If sourcemaps defined
                    if  (sassu.opts.outputSourcemaps[outputStyle]) {
                        let map = result.map.toString();
                        
                        log(`Starting write sourcemap at ${chalk.cyan(cleanCwdStr(nodeSassOptions.outFile) + '.map')}`);

                        fs.writeFile(nodeSassOptions.outFile + '.map', map, sassu.opts.encoding, function(err) {
                            if (!err) {
                                log(`Finished write sourcemap at ${chalk.green(cleanCwdStr(nodeSassOptions.outFile) + '.map')}`);
                            } else {
                                logError(err);
                            }
                        });

                    }
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
 * Watch sass files
 * @return {Void}
 */
Sassu.prototype.watch = function() {
    // Sassu instance
    let sassu = this;

    log('Starting watch task');

    sassu.filterFiles(function(files) {
        sassu.buildSass(files);

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
