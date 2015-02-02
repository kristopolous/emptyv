cat swfobject.js evda.js > deps.js
in=deps.js
out=deps.min.js

curl -s \
        -d compilation_level=SIMPLE_OPTIMIZATIONS \
        -d output_format=text \
        -d output_info=compiled_code \
        --data-urlencode "js_code@${in}" \
        http://closure-compiler.appspot.com/compile \
        > $out

