#!/bin/bash

# Minifies all of the assets for the application.

JS_FILES=(web/assets/backbone.js/js/backbone.js
          web/assets/beyond.js/js/beyond.js
          web/assets/jquery/js/jquery.js
          web/assets/jquery-cookie/js/jquery.cookie.js
          web/assets/underscore.js/js/underscore.js
          web/js/main.js)

CSS_FILES=(web/assets/normalize.css/css/normalize.css
           web/assets/font-awesome/css/font-awesome.css
           web/css/layout.css)

JS_COMPILER_PATH="/usr/bin/yui-compressor"
CSS_COMPILER_PATH="/usr/bin/yui-compressor"

for file in ${JS_FILES[@]}
do
    echo "Minifying ${file}.."

    new="$(dirname $file)/min-$(basename $file)"
    ${JS_COMPILER_PATH} --type js -o ${new} ${file}
done

for file in ${CSS_FILES[@]}
do
    echo "Minifying ${file}.."

    new="$(dirname $file)/min-$(basename $file)"
    ${JS_COMPILER_PATH} --type css -o ${new} ${file}
done
