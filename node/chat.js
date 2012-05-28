var _db;

module.exports = {
  append: append,
  add: add,
  setDB: function(which) {
    _db = which;
  },
  announce: function(message) {
    _db.incr("ix", function(err, id) {
      var payload = [ 
        id, 
        "<p class=announce>" + message + "</p>"
      ];
      add("log:" + _user.channel, payload);
    });
  }
};

function append(key, data) {
  _db.rpush( key, JSON.stringify(data) )

  if(Math.floor(Math.random() * 10) == 5) {
    _db.ltrim(key, -20, -1);
  }
}

function add(channel, obj) {
  if(!channel) {
    return;
  }
  _db.incr("ix", function(err, id) {
    obj._id = id;
    obj._ts = +(new Date());
    append("log:" + channel, obj);
  });
}
