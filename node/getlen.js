var redis = require('redis')
  , _db = redis.createClient();

_db.select(1);

var len = 0;
_db.lrange("pl:80smtv", 0, -1, function(err, res) {
  _db.hmget("vid", res, function(err, res) {
    res.forEach(function(row) {
      row = JSON.parse(row);
      len += parseInt(row[0]);
    });
    console.log(len);
  });
});
