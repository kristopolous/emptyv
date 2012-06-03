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
  fix: function(name) {
    _db.exists("pl:" + name, function (err, last) {
      if(!last) {
        remove(name);
      }
    });
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
  getAll: function(cb) {
    _db.hkeys("channel", function(err, last) {
      cb(last);
    });
  },
  updatelen: function(name) {
    var len = 0;
    _db.lrange("pl:" + name, 0, -1, function(err, res) {
      _db.hmget("vid", res, function(err, res) {
        res.forEach(function(row) {
          row = JSON.parse(row);
          len += parseInt(row[0]);
        });
        update(name, {len: len});
      });
    });
  },
  generate: function(cb) {
    _db.hvals("channel", function(err, channelList) {

      for(var ix = 0; ix < channelList.length; ix++) {
        channelList[ix] = JSON.parse(channelList[ix]);
      }

      cb(channelList.sort(function(a, b) {
        return (b.count || 0) - (a.count || 0);
      }));
    }); 
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
  console.log("Removing " + channel);
  _db.hdel('tick', channel);
  _db.hdel('channel', channel);
}

function create(name){
  _db.hset("tick", name, [0,0].join());
  _db.hset("channel", name, JSON.stringify({name: name}));
}
