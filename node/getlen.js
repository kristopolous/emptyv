var redis = require('redis')
  , total = 0
  , count = 0
  , _db = redis.createClient();

_db.select(1);

_db.keys("pl:*", function(err, list) {
  list.forEach(function(which) {
    var len = 0;
    _db.lrange(which, 0, -1, function(err, res) {
      _db.hmget("vid", res, function(err, res) {
        if(res) {
          res.forEach(function(row) {
            row = JSON.parse(row);
            len += parseInt(row[0]);
          });
          total += len;
          count += res.length;
          console.log(total / 60 / 60, count);
          console.log((len / 60 / 60).toFixed(2), res.length, which.split(":").pop());
        }
      });
    });
  });
});
