var redis = require('redis')
  , _db = redis.createClient();

_db.select(1);

function rebuild(channel, list) {
  if(list.length > 0) {
    console.log("Putting " + list[0] + " upon " + channel);
    _db.rpush('pl:' + channel, list.shift(), function(err, last) {
      rebuild(channel, list);
    });
  }
}

_db.hkeys("tick", function(err, state) {
  state.forEach(function(channel) {
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
      _db.del("pl:" + channel, function(err, last) {
        rebuild(channel, cleaned);
      });
    });
  });
});
