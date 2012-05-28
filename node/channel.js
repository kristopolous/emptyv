var _db;
module.exports = {
  create: create,
  remove: remove,
  update: update,
  count: count,
  join: function(name, user) {
    _db.set("user:" + name + ":" + user, 1);
    _db.expire("user:" + name + ":" + user, 10);
    count(name);
  },
  leave: function(name, user) {
    if(name) {
      _db.del("user:" + name + ":" + user);
      count(name);
    }
  },
  setDB: function(which) {
    _db = which;
  },
  get: function(name, cb) {
    _db.hget("channel", name, function(err, chan) {
      if(!chan) {
        create(name);
      }
      cb();
    })
  }
};

function count(channel) {
  _db.keys("user:" + channel + ":*", function(err, all) {
    var count = all.length;
    update(channel, {count: count});
  });
}

function update(name, newData) {
  _db.hget('channel', name, function(err, data) {
    var oldData = JSON.parse(data) || {};
    for(var key in newData) {
      oldData[key] = newData[key];
    }
    _db.hset('channel', name, JSON.stringify(oldData));
  });
  return newData;
}

function remove(channel) {
  _db.hdel('tick', channel);
  _db.hdel('channel', channel);
}

function create(name){
  _db.hset("tick", name, [0,0].join());
  _db.hset("channel", name, JSON.stringify({name: name}));
}
