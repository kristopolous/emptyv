var redis = require('redis')
  , _db = redis.createClient();

_db.select(1);

_db.hgetall("tick", function(err, state) {
  for(var channel in state) {
    
    _db.lrange("pl:" + channel, 0, -1, function(err, alltunes) {
      var 
        hash = {},
        cleaned = [];

      alltunes.forEach(function(entry){
        if(hash[entry]) {
          return;
        } else {
          hash[entry] = true;
          cleaned.push(entry);
        }
      });
      console.log("I want to modify " + channel + " by replacing " + alltunes.length + " with " + cleaned.length);
    });
  }
});
