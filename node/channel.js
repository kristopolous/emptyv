var _db;

module.exports = {
  create: create,
  remove: remove,
  update: update,
  count: count,
  getPlaylist: getplaylist,
  join: function(name, user, cb) {
    _db.set("user:" + name + ":" + user, 1);
    _db.expire("user:" + name + ":" + user, 10, function(){
      count(name, cb);
    });
  },
  fix: function(name) {
    _db.exists("pl:" + name, function (err, last) {
      if(!last) {
        remove(name);
      }
    });
  },
  leave: function(name, user, cb) {
    if(name) {
      _db.del("user:" + name + ":" + user, function(err, last) {
        count(name, cb);
      });
    } else {
      if(cb) {
        cb();
      }
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

function count(channel, cb) {
  _db.keys("user:" + channel + ":*", function(err, all) {
    var count = all.length;
    update(channel, {count: count}, cb);
  });
}

function update(name, newData, cb) {
  _db.hget('channel', name, function(err, data) {
    var oldData = JSON.parse(data) || {};
    for(var key in newData) {
      oldData[key] = newData[key];
    }
    _db.hset('channel', name, JSON.stringify(oldData), function() {
      if(cb) {
        cb();
      }
    });
  });
  return newData;
}

function remove(channel) {
  _db.hdel('channel', channel);
}

function create(name){
  _db.hset("channel", name, JSON.stringify({name: name}));
}

function getplaylist(data, cb) {
  var 
    list = {}, 
    runs = 0;

  if(!data.channel) {
    console.log("Error, I need a channel");
    return;
  }
  if(data.end > 0) {
    runs++;
  }
  if(data.begin < 0) {
    runs++;

    // The range can be, say
    //
    // 1) [-x , -y]
    // 2) [-x , 0]
    // 3) [-x, +y]
    // 4) [0, +y]
    // 5) [+x, +y]

    // lrange 0 0 still has a result
    _db.lrange(
      "prev:" + data.channel, 

      // This is for 1
      Math.min(0, data.begin), 

      // This is for 1 and 2
      //
      // lrange with a second arg of 0 will
      // return nothing
      Math.min(-1, data.end), 

      function(err, last) {
        var index = data.begin + 1;
        last.forEach(function(row) {
          list[index] = JSON.parse(row);
          index++;
        });

        if(--runs == 0) {
          cb(list);
        }
      });
  }

  // 1 and 2 are done here
  if(data.end <= 0) {
    return;
  }

  // For 3, 4, and 5, we need to take the next
  // into account.
  //

  // try to get what we can from the current request stack
  _db.lrange("re:" + data.channel, 
    // This covers 4
    Math.max(0, data.begin), 
    data.end, function(err, next) {

    var index = Math.max(0, data.begin);

    console.log("request queue: ", next);

    next.forEach(function(row) {
      list[index] = JSON.parse(row);
      index++;
    });

    // Our beginning pointer should be shifted 
    // BACKWARD by our request count size.
    var newstart = data.begin - next.length;

    // Similarly, the end pointer should also
    // be shifted back too
    var newend = data.end - next.length;

    // If the newend is negative, that is to say,
    // there is nothing more to get, then we
    // can stop here.
    if(newend <= 0) {
      if(--runs == 0) {
        cb(list);
      }
      return;
    }

    // Otherwise, we find the index that we are currently at
    _db.hget("play", data.channel, function(err, last) {
      var currentState = JSON.parse(last);

      // Get the last synchronized playlist
      _db.get("p:" + data.channel, function(err, last) {

        // And form an ROI, which is offset from
        // our newstart to our newend
        var entryList = JSON.parse(last).slice(
          currentState.index + newstart,
          currentState.index + newend
        );

        // Since the playlist is strictly id based, we
        // need to go off and get the entries in the DB.
        _db.hmget("vid", entryList, function(err, res) {

          // The starting index is just our old start
          for( 
            var ix = 0, index = data.begin;
            ix < res.length; 
            index++, ix++) {
              var entry = JSON.parse(res[ix]);
              list[index] = {
                vid: entryList[ix],
                artist: entry[3],
                title: entry[4]
              };
            }

          if(--runs == 0) {
            cb(list);
          }
        });
      });
    });
  });
}
