[![Build Status](https://travis-ci.org/yusrilhs/sassu.svg?branch=master)](https://travis-ci.org/yusrilhs/sassu)

# Sassu
Sassu is a simple command line utility for sass. This project is inspired by [gulp](https://gulpjs.com/) and using any gulp plugins with some modification. Sassu is created for someone which work offline and want to play with sass.  

The first, this project is writing with rely on `Promise`, but I don't know why that have more delay when building sass files and execute postcss. Then i compare this project with gulp and WOW! gulp is very fast. Then i rewrite all code into stream using `vinyl-fs`. 
