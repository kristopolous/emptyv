#!/bin/sh
cd ../js
in=all.js
out=all.min.js

cat swfobject.js lean.js mt80s.js > all.js 
curl -s \
        -d compilation_level=SIMPLE_OPTIMIZATIONS \
        -d output_format=text \
        -d output_info=compiled_code \
        --data-urlencode "js_code@${in}" \
        http://closure-compiler.appspot.com/compile \
        > $out
