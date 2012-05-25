var _db;
module.exports = {
  create: create,
  remove: remove,
  update: update,
  count: count,
  join: function(name, user) {
    _db.sadd("user:" + name, user);
    count(name);
  },
  leave: function(name, user) {
    if(name) {
      _db.srem("user:" + name, user);
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
  _db.scard("user:" + channel, function(er, count) {
    update(channel, {count: count});
  });
}

function update(name, newData) {
  _db.hget('channel', name, function(err, data) {
    var oldData = JSON.parse(data);
    for(var key in newData) {
      oldData[key] = newData[key];
    }
    _db.hset('channel', name, JSON.stringify(oldData));
  });
}

function remove(channel) {
  _db.hdel('tick', channel);
  _db.hdel('channel', channel);
}

function create(name){
  _db.hset("tick", name, [0,0].join());
  _db.hset("channel", name, JSON.stringify({name: name}));
}
