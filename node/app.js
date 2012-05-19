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
  width = width || 20;
  DB.multi([
    [ "rpush", key, JSON.stringify(data) ],
    [ "ltrim", key, -width, -1]
  ]).exec();
}

var search = (function(){

  var _payload;

  function stem(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z\ 0-9@]/g,'')
      .replace(/\s+/g, ' ')
  }

  function build(){
    console.log("[qdb] Building");
    var 
      rows = [], 
      parsed;

    DB.hgetall("vid", function(err, all) {
      for(var key in all) {
        parsed = JSON.parse(all[key]);
        rows.push([
          key,
          stem(parsed[4] + '@' + parsed[3])
        ].join('@'));
      }
      _payload = '\n' + rows.join('\n') + '\n';
      console.log("[qdb] Built");
    });
  }

  function process(data, cb) {
    var results = [], song;
    if(data.feed.entry) {
      data.feed.entry.forEach(function(result) {
        song = result.title.$t.split('-').reverse(); 
        results.push({
          vid: 'yt:' + result.media$group.yt$videoid.$t,
          title: song.shift(),
          artist: song.reverse().join('-'),
          len: result.media$group.yt$duration.seconds
        });
      });
    }
    cb(false, results);
  }

  function local(query, cb) {
    var 
      res,
      results = [],
      re = new RegExp("[^\n]*" + stem(query) + "[^\n]*", "g");

    while ( (match = re.exec(_payload) ) != null) {
      res = match[0].split('@');
      results.push( {
        vid: res.shift(),
        title: res.shift(),
        artist: res.join('@')
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

  build();
  setInterval(build, 900 * 1000);

  return function(query, cb) {
    var
      _remote,
      _local;

    function verify() {
      if(_local && _remote) {
        cb(false, _local.concat(_remote));
      }
    }

    local(query, function(err, res) {
      _local = res;
      verify();
    });

    remote(query, function(err, res) {
      _remote = res;
      verify();
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
    create: function(params){
      console.log("Creating ", params);
    },
    list: function(params) {
    },
    join: function(which) {
      _user.channel = which;
      socket.emit("channel-name", which);
      DB.sadd("user:" + which, _user.uid);
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

    _channel.join("80smtv");

    if(!_ival.poll) {
      _ival.poll = setInterval(poll, 50);
      _ival.song = setInterval(song, 1000);
      song();
    }
  });

  socket.on("search", function(q) {
    search(q, function(err, res) {
      socket.emit("search-results", {
        query: q,
        results: res
      });
    });
  });

  socket.on("video-play", function(p) {
    p.channel = _user.channel;
    DB.lpush("request", JSON.stringify(p));
  });

  socket.on("get-history", function(p) {
    var chan = _user.channel;
    DB.lrange("lastplayed:" + chan, 0, -1, function(err, last){
      for(var ix = 0; ix < last.length; ix++) {
        last[ix] = JSON.parse(last[ix]);
      }
      socket.emit("search-results", {
        channel: chan,
        results: last.reverse()
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
      add("logall", payload, 80);
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
      add("logall", payload, 80);
    });
  }

  socket.on("chat", chat);
});
