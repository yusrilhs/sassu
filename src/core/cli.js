'use strict';

const fs = require('fs')
    , path = require('path')
    , chalk = require('chalk')
    , yaml = require('js-yaml')
    , globby = require('globby')
    , sassGraph = require('sass-graph')
    , sassu = require('../sassu')
    , getPostcssPlugins = require('./get-postcss-plugins')
    , utils = require('./utils')
    , log = utils.log
    , logError = utils.logError;

/**
 * Get .sassurc configuration file
 * @param  {Any}    cfg 
 * @return {Object}     
 */
function getConfig(cfg) {
    // If that not a string let use blank string for configPath
    let configPath = (typeof cfg === 'string') ? cfg : '';
    let resolvedConfigPath = path.resolve(process.cwd(), configPath);
    let sassurcFile = path.join(resolvedConfigPath, '.sassurc');

    if (!fs.existsSync(sassurcFile)) {
        logError(`${sassurcFile} doesn't exists`);
        // Just use default option if file doesn't exists
        return {};
    } else {
        let sassurcContent = fs.readFileSync(sassurcFile, 'utf-8');
        // Blank file will be undefined
        let doc = yaml.safeLoad(sassurcContent, 'utf-8') || {};

        // Set destination path
        if (doc.dest) doc.dest = path.join(resolvedConfigPath, doc.dest);
        
        if (doc.includePaths instanceof Array) {
            for(let i=0,len=doc.includePaths.length;i<len;i++) {
                doc.includePaths[i] = path.join(resolvedConfigPath, doc.includePaths[i]);
            }
        }

        return doc;
    }
}

/**
 * Get support extension
 * @param  {String} ext 
 * @return {String}     
 */
function getSupportExt(ext) {
    if (!ext) return 'sass,scss';

    let supports = ext.split(',');

    for(let i=0,len=supports.length;i<len;i++) {
        if (supports[i] !== 'scss' && supports[i] !== 'sass') {
            throw new Error(`${supports[i]} extension is not supported`);
        }
    }

    return supports.join(',');
}

/**
 * Return task of files
 * @param  {Array}  files 
 * @return {Object}       
 */
function getSassFiles(files) {
    let ret = {
        build: [],
        watch: []
    };

    for(let i=0,len=files.length;i<len;i++) {
        if (path.basename(files[i]).charAt(0) !== '_') {
            ret.build.push(files[i]);
        }

        ret.watch.push(files[i]);
    }

    log(`Founded ${ret.build.length} sass file to build`);

    return ret;
}

/**
 * Get files from source path
 * @param  {String} sourcePath 
 * @param  {String} ext 
 * @param  {Array}  includePaths 
 * @return {Object}             
 */
function getFiles(sourcePath, ext, includePaths) {
    sourcePath = (typeof sourcePath === 'string') ? sourcePath : '';
    let extname = path.extname(sourcePath),
        resolvedSourcePath = path.resolve(process.cwd(), sourcePath),
        ret;

    log(`Finding sass file at ${chalk.blue(resolvedSourcePath)}`);

    if (extname === '.scss' || extname === '.sass') {
        if (fs.existsSync(resolvedSourcePath) && fs.lstatSync(resolvedPath).isFile()) {
            let parseGraph = sassGraph.parseFile(resolvedSourcePath, {
                loadPaths: includePaths
            });
            
            ret = getSassFiles(Object.keys(parseGraph.index));
            ret.ext = extname;

            return ret;
        } else {
            throw new Error(`File ${resolvedPath} doesn't exists`);
        }
    } else {
        let supportExt = getSupportExt(ext);
        // Another file extension
        if (extname != '' && fs.lstatSync(resolvedPath).isFile()) {
            throw new Error(`File with extension ${extname} doesn't support`);
        }

        let files = globby.sync([
            path.join(resolvedSourcePath, `**/*.{${supportExt}}`),
            path.join('!**/node_modules' , `**/*.{${supportExt}}`), // Ignore node_modules
            path.join('!**/bower_components' , `**/*.{${supportExt}}`) // Ignore bower_components
        ]);
        
        ret = getSassFiles(files);
        ret.ext = supportExt;
        
        return ret;
    }
}

/**
 * Command line arguments
 * @param  {commander} program 
 * @return {Void}        
 */
module.exports = function(program) {
    // Is generate config task?
    if (program.genConfig) {
        let resolvedPath,
            sassurcFile,
            sassurcDest;

        // If that not a string let use blank string
        program.genConfig = (typeof program.genConfig === 'string') ? 
                            program.genConfig : '';

        resolvedPath = path.resolve(process.cwd(), program.genConfig);

        if (fs.lstatSync(resolvedPath).isDirectory()) {
            sassurcFile = fs.readFileSync(path.join(__dirname, '../../.sassurc'), 'utf-8');
            sassurcDest = path.join(resolvedPath, '.sassurc');
            
            // Write if not exists
            if (!fs.existsSync(sassurcDest)) fs.writeFileSync(sassurcDest, sassurcFile);
            else throw new Error(`.sassurc already exists on ${sassurcDest}`);

            log(`.sassurc has been created on ${sassurcDest}`);
        }
        
    // Is build or watch task?
    } else if (program.build) {
        let config = getConfig(program.config),
            files = getFiles(program.build, program.ext, config.includePaths);
        
        sassu.build(files.build, config, getPostcssPlugins(config));
       
    // Is watch task?
    } else if (program.watch) {
        let config = getConfig(program.config),
            files = getFiles(program.watch, program.ext, config.includePaths),
            postCssPlugins = getPostcssPlugins(config);

        sassu.build(files.build, config, postCssPlugins)
             .on('end', function() {
                let watch = typeof program.watch === 'string' ? program.watch : process.cwd(); 
                fs.lstat(watch, function(err, stats) {
                    if (stats.isFile()) {
                        watch = path.dirname(watch);
                    }

                    sassu.watch(files.build, path.join(watch, `**/*.{${files.ext}}`), config, postCssPlugins);
                });  
             });
    } else {
        console.log(program.helpInformation());
    }
};
