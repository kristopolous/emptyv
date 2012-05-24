var app = require('http').createServer(function(){})
  , redis = require('redis')
  , DB = redis.createClient()
  , IO = require('socket.io').listen(app)
  , QS = require('querystring')
  , HTTP = require('http')
  , MD = require("node-markdown").Markdown
  , VERSION = 2;

DB.select(1);
app.listen(1985);

function uidgen() {
  return (Math.random() * Math.pow(2,63)).toString(36);
}

function add(key, data, width) {
  width = width || 100;
  DB.multi([
    [ "rpush", key, JSON.stringify(data) ],
    [ "ltrim", key, -width, -1]
  ]).exec();
}

var search = (function(){

  function process(data, cb) {
    var results = [], title, artist, split;
    if(data.feed.entry) {
      data.feed.entry.forEach(function(result) {
        split = result.title.$t.split('-');
        if(split.length == 1) {
          artist = "";
          title = split[0];
        } else {
          artist = split.shift();
          title = split.join('-');
        }
        results.push({
          vid: 'yt:' + result.media$group.yt$videoid.$t,
          title: title,
          artist: artist,
          len: result.media$group.yt$duration.seconds
        });
      });
    }
    cb(false, results);
  }

  function remote(query, cb) {
    var 
      results = [],
      req = HTTP.request({
        host: 'gdata.youtube.com',
        path: '/feeds/api/videos?' + QS.stringify({
          alt: 'json',
          q: query,
          orderby: 'relevance',
          'max-results': 10,
          v: 2,
          format: 5
        })
      }, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) { results.push(data); });
        res.on('end', function(){ process(JSON.parse(results.join('')), cb); });
      });

    req.on('error', function(){ cb(arguments, fale); });
    req.end();
  }

  return function(query, cb) {
    var local = [];
    remote(query, function(err, res) {
      var idList = res.map(function(row) { return row.vid });
      DB.hmget("vid", idList, function(err, data) {
        for(var ix = data.length - 1; ix >= 0; ix--) {
          if(data[ix]) {
            local.push(res[ix]);
            res.splice(ix, 1);
          }
        }
        cb(false, {
          local: local,
          remote: res,
          total: local.length + res.length
        });
      });
    });
  }

})();

IO.sockets.on('connection', function (socket) {
  var 
    _user = {}, 
    _song = {},
    _online = -1,
    _ival = {};

  var _channel = {
    get: function(name, cb) {
      DB.hget("channel", name, function(err, chan) {
        if(!chan) {
          console.log("Creating " + name);
          DB.hset("tick", name, [0,0].join());
          DB.hset("channel", name, JSON.stringify({}));
        }
        cb();
      })
    },

    create: function(name){
      console.log("Creating ", name);
      DB.hset("channel", name, JSON.stringify({}));
    },

    list: function(params) {
    },

    join: function(which) {
      _channel.get(which, function(){
        if(_user.channel) {
          _channel.leave();
        }
        _user.channel = which;
        socket.emit("channel-name", which);
        if(_user.uid) {
          DB.sadd("user:" + which, _user.uid);
        }
      });
    },

    leave: function() {
      if(_user.uid) {
        DB.srem("user:" + _user.channel, _user.uid);
      }
    },

    play: function(params) {
      DB.set("request", JSON.stringify(params));
    },
    update: function(params) {
    }
  };

  socket.on("disconnect", function(){
    if(_user.name && _user.name != "anonymous") {
      announce(_user.name + " logged out");
    }
    for(var which in _ival) {
      clearInterval(_ival[which]);
    };
    _channel.leave();
  });

  socket.on("channel-join", function(obj){
    console.log(obj);
    _channel.join(obj.channel);
  });

  socket.on("channel-create", function(obj) {
    _channel.create(obj.channel);
  });

  socket.on("get-channels", function(obj) {
    DB.hgetall("channel", function(err, channelMap) {
      var 
        channelNameList = Object.keys(channelMap),
        channelObjList = [],
        playCount = channelNameList.length,
        userCount = channelNameList.length;

      function check() {
        if(playCount === 0 && userCount === 0) {
          socket.emit("channel-results", 
            channelObjList.sort(function(a, b) {
              return b.count - a.count;
            })
          );
        }
      }
      channelNameList.forEach(function(channel) {
        if(channel.length == 0) {
          playCount --;
          userCount --;
          return;
        }
        channelMap[channel] = JSON.parse(channelMap[channel]);
        channelMap[channel].name = channel;
        channelObjList.push(channelMap[channel]);
        DB.lrange("lastplayed:" + channel, -1, -1, function(er, lastplayed) {
          if(lastplayed && lastplayed.length && lastplayed[0].length) {
            channelMap[channel].lastplayed = JSON.parse(lastplayed[0]); 
          }
          check(--playCount);
        });
        DB.scard("user:" + channel, function(er, count) {
          channelMap[channel].count = count;
          check(--userCount);
        }); // scard user
      }); // foreach
    }); // hget channel
  }); // socket-on

  function song() {
    DB.hget("play", _user.channel, function(err, last) {
      if(!last) {
        return;
      }
      var song = JSON.parse(last);
      if(song.vid == _song.vid) {
        return;
      } else {
        _song = song;
        socket.emit("song", [
          song.vid,
          song.len,
          song.offset.toFixed(3),
          song.start,
          song.volume,
          song.artist,
          song.title,
          song.notes
        ]);
      }
    });
  }

  function poll() {
    DB.get("ix", function(err, last) {

      DB.lrange(
        "log:" + _user.channel, 
        0, -1, 
        function(err, data) {
          var 
            row,
            chat = [];

          data.forEach(function(rowRaw) {
            row = JSON.parse(rowRaw);
            if(row[0] > _user.lastid) {
              _user.lastid = row[0];
              chat.push(row);
            }
          })
          if(chat.length) {
            socket.emit("chat", chat);
          }
        });
    });

    DB.scard("user:" + _user.channel, function(err, online) {
      if(online != _online) {
        _online = online;
        socket.emit("stats", {online: online});
      }
    });
  }

  setTimeout(function(){
    if(!_user.color) {
      socket.emit("greet-request", VERSION);
    } else {
      socket.emit("version", VERSION);
    }
  }, 1000);

  socket.on("greet-response", function(p) {
    _user = p;
    _user.name = "anonymous";

    if(!_user.uid) {
      _user.uid = uidgen();
      socket.emit("uid", _user.uid);
    } else {
      DB.hget("user", _user.uid, function(err, last) {
        if(last) {
          _user.name = last;
          socket.emit("username", _user.name);
          announce(_user.name + " logged in");
        } else {
          socket.emit("username", false);
        }
      });
    }

    _channel.join(_user.channel);

    if(!_ival.poll) {
      _ival.poll = setInterval(poll, 50);
      _ival.song = setInterval(song, 1000);
      song();
    }
  });

  socket.on("search", function(q) {
    search(q, function(err, res) {
      socket.emit("song-results", {
        query: q,
        results: res
      });
    });
  });

  socket.on("video-play", function(p) {
    p.channel = _user.channel;
    p.name = _user.name;
    DB.lpush("request", JSON.stringify(p));
  });

  socket.on("really-delist", function(p) {
    DB.lpush("request", JSON.stringify({
      track: p,
      action: "really-delist",
      name: _user.name,
      channel: _user.channel
    }));
  });

  socket.on("delist", function(p) {
    DB.lpush("request", JSON.stringify({
      track: p,
      action: "delist",
      name: _user.name,
      channel: _user.channel
    }));
  });

  socket.on("get-history", function(p) {
    var chan = _user.channel;
    DB.lrange("lastplayed:" + chan, 0, -1, function(err, last){
      for(var ix = 0; ix < last.length; ix++) {
        last[ix] = JSON.parse(last[ix]);
      }
      socket.emit("song-results", {
        channel: chan,
        results: {
          total: last.length,
          history: last.reverse()
        }
      });
    });
  });

  socket.on("set-user", function(p) {
    if(p.user) {
      if(_user.name != "anonymous") {
        announce(_user.name + " is now known as " + p.user);
      } else {
        announce(p.user + " logged in");
      }
      _user.name = p.user;
      DB.hset("user", _user.uid, p.user);
      socket.emit("username", _user.name);
    } else {
      announce(_user.name + " logged out");
      DB.hdel("user", _user.uid);
      _user.name = "anonymous";
    }
  });

  function announce(message) {
    DB.incr("ix", function(err, id) {
      var payload = [ 
        id, 
        "<p class=announce>" + message + "</p>"
      ];
      add("log:" + _user.channel, payload);
      add("logall", payload, 400);
    });
  }

  function chat(p) {
    if(!p.d) {
      return;
    }

    DB.incr("ix", function(err, id) {
      var payload = [ 
        id, 
        MD(p.d
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')),
        _user.color,
        _user.name
      ];
      add("log:" + _user.channel, payload);
      add("logall", payload, 400);
    });
  }

  socket.on("chat", chat);
});
