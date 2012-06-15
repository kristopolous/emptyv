var redis = require('redis')
  , _db = redis.createClient()
  , _state = {};

_db.select(1);

_db.keys("pl:*", function(err, keyList) {
  keyList.forEach(function(key) {
    _db.lrange(key, 0, -1, function(err, last) {
      console.log(key.slice(0));
      _db.set("p:" + key.slice(3), JSON.stringify(last));
    });
  });
});
