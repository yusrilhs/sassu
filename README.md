[![Build Status](https://travis-ci.org/yusrilhs/sassu.svg?branch=master)](https://travis-ci.org/yusrilhs/sassu)

# Sassu
Sassu is a simple command line utility for sass. This project is inspired by [gulp](https://gulpjs.com/) and using any gulp plugins with some modification. Sassu is created for someone which work offline and want to play sass with [autoprefixer](https://github.com/postcss/autoprefixer). I add [postcss-flexbugs-fixes](https://github.com/luisrudge/postcss-flexbugs-fixes) and [oldie](https://github.com/jonathantneal/oldie) too for your comfortable with playing sass.

The first, this project is writing with rely on `Promise`, but I don't know why that have more delay when building sass files and execute postcss. Then i compare this project with gulp and WOW! gulp is very fast. Then i rewrite all code into stream using `vinyl-fs`. 

## Installation
`npm install -g sassu`

## Usage
```
Usage: sassu [options]

  Options:

    -V, --version                    output the version number
    -w, --watch        [dir]         sass directory to watch, default path is cwd
    -b, --build        [dir | file]  sass directory/file to build, default dir is cwd
    -e, --ext          <extension>   sass file extension. default is sass,scss
    -c, --config       [path]        path to .sassurc file. default path is cwd
    -g, --gen-config   [path]        generate .sassurc into path. default path is cwd
    -h, --help                       output usage information
```
