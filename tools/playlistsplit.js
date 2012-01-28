var 
  fs = require('fs'),
  lean = [], 
  info = [];

for(var ix = 0; ix < _duration.length; ix++) {
  lean.push(_duration[ix].slice(0,_duration[ix].length - 1));
  info.push(_duration[ix].slice(5,_duration[ix].length));
}

fs.writeFile('../js/lean.js', "var _duration="+JSON.stringify(lean)+";");
fs.writeFile('../js/info.js', "append("+JSON.stringify(info)+");");
