'use strict';

const chalk = require('chalk');

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

// Silent while test module
if (process.env.NODE_ENV == 'test') {
    log = function() {};
    logError = function() {};
}

/**
 * Register utils module
 * @type {Object}
 */
module.exports = {
    log: log,
    logError: logError
};
