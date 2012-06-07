var app = require('http').createServer(function(){})
  , redis = require('redis')
  , _db = redis.createClient()
  , _md = require("node-markdown").Markdown
  , IO = require('socket.io').listen(app)
  , QS = require('querystring')
  , Chat = require('./chat')
  , Channel = require('./channel')
  , User = require('./user')
  , HTTP = require('http');

_db.select(1);
app.listen(1985);
Chat.setDB(_db);
Channel.setDB(_db);
IO.set('log level', 1)

function uidgen() {
  return (Math.random() * Math.pow(2,63)).toString(36);
}

var search = (function(){

  function process(data, cb) {
    var results = [], title, artist, split;
    if(data.feed.entry) {
      data.feed.entry.forEach(function(result) {
        split = result.title.$t.split(' - ');
        if(split.length == 1) {
          artist = "";
          title = split[0];
        } else {
          artist = split.shift();
          title = split.join(' - ');
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
          'max-results': 25,
          v: 2,
          format: 5
        })
      }, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) { results.push(data); });
        res.on('end', function(){ process(JSON.parse(results.join('')), cb); });
      });

    req.on('error', function(){ cb(arguments, false); });
    req.end();
  }

  return function(query, cb) {
    var local = [];
    remote(query, function(err, res) {
      var idList = res.map(function(row) { return row.vid });
      _db.hmget("vid", idList, function(err, data) {
        if(data) {
          for(var ix = data.length - 1; ix >= 0; ix--) {
            if(data[ix]) {
              local.push(res[ix]);
              res.splice(ix, 1);
            }
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
    _user = {greeted: false}, 
    _song = {},
    _online = -1,
    _ival = {};

  var _channel = {

    join: function(which) {
      Channel.get(which, function(){
        _channel.leave(function(){
          Channel.join(which, _user.uid, function(){;
            if(_user.loggedin) {
              if ( _user.channel && (_user.channel != which)) {
                announce(_user.name + " left and went to <a href=#" + escape(which) + ">" + which + "</a>.");
              }
              announce(_user.name + " joined", which);
            }
            _user.channel = which;
            socket.emit("channel-name", which);
          });
        });
      });
    },

    leave: function(cb) {
      Channel.leave(_user.channel, _user.uid, cb);
    },

    play: function(params) {
      _db.set("request", JSON.stringify(params));
    }
  };

  function disconnect() {
    // A disconnect isn't a logout. We don't
    // remove the k/v connection of the UID/user
    // from redis. That has to be done OOB.
    if(_user.name && _user.name != "anonymous") {
      announce(_user.name + " logged out");
      _user.loggedin = false;
      _user.name = "anonymous";
    }
  }

  function song() {
    if(!_user.channel) {
      return;
    }
    _db.set("user:" + _user.channel + ":" + _user.uid, 1);
    _db.expire("user:" + _user.channel + ":" + _user.uid, 10);

    _db.hget("play", _user.channel, function(err, last) {
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
          song.offset !== null ? song.offset.toFixed(3) : 0,
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
    if(!_user.channel) {
      return;
    }
    _db.get("ix", function(err, last) {

      _db.lrange(
        "log:" + _user.channel, 
        0, -1, 
        function(err, data) {
          var 
            row,
            chat = [];

          data.forEach(function(rowRaw) {
            row = JSON.parse(rowRaw);
            if(row._id > _user.lastid) {
              _user.lastid = row._id;
              chat.push(row);
            }
          })
          if(chat.length) {
            socket.emit("chat", chat);
          }
        });
    });

    _db.keys("user:" + _user.channel + ":*", function(err, all) {
      var online = all.length;
      if(online != _online) {
        _online = online;
        socket.emit("stats", {online: online});
      }
    });
  }

  function announce(message, channel) {
    Chat.add(
      (channel || _user.channel), {
        type: 'announce',
        text: message,
        uid: _user.uid
      }
    );
  }

  socket.on("disconnect", function(){
    disconnect();
    for(var which in _ival) {
      clearInterval(_ival[which]);
    };
    _channel.leave();
  });

  socket.on("channel-join", function(obj){
    _channel.join(unescape(obj.channel));
  });

  socket.on("channel-create", function(obj) {
    Channel.create(obj.channel);
  });

  socket.on("get-channels", function(obj) {
    Channel.generate(function(data) {
      socket.emit("channel-results", data);
    }); 
  }); 

  socket.on("greet-response", function(p) {
    if(_user.greeted) {
      return;
    }
    _user.greeted = true;
    _user.loggedin = false;
    _user = p;
    _user.channel = unescape(_user.channel);
    _user.name = "anonymous";

    if(!_user.uid) {
      _user.uid = uidgen();
      socket.emit("uid", _user.uid);
    } else {
      _db.hget("user", _user.uid, function(err, last) {
        if(last) {
          login(last);
        } else {
          socket.emit("username", false);
        }
      });
    }

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
    p.uid = _user.uid;
    p.now = false;
    _db.lpush("request", JSON.stringify(p));
  });

  socket.on("video-play-now", function(p) {
    p.channel = _user.channel;
    p.name = _user.name;
    p.uid = _user.uid;
    p.now = true;
    _db.lpush("request", JSON.stringify(p));
  });

  socket.on("delist", function(p) {
    _db.lpush("request", JSON.stringify({
      action: "delist",
      track: p,
      name: _user.name,
      uid: _user.uid,
      channel: _user.channel
    }));
  });

  socket.on("skip", function(vid) {
    _db.lpush("request", JSON.stringify({
      action: "skip",
      vid: vid,
      name: _user.name,
      uid: _user.uid,
      channel: _user.channel
    }));
  });

  socket.on("get-history", function(p) {
    var chan = _user.channel;
    _db.lrange("lastplayed:" + chan, 0, -1, function(err, last){
      for(var ix = 0; ix < last.length; ix++) {
        last[ix] = JSON.parse(last[ix]);
      }
      socket.emit("history", {
        channel: chan,
        results: {
          total: last.length,
          history: last.reverse()
        }
      });
    });
  });

  function login(name) {
    _user.loggedin = true;
    _user.name = name;
    announce(name + " logged in");
    _db.hset("user", _user.uid, name);
    socket.emit("username", name);
  }

  socket.on("set-user", function(p) {
    // Either a registeration or a reset
    if(p.email) {
      // Registration
      if(p.user) {
        // Prevent xss
        p.user = p.user.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        User.exists("username", p.user, function(exist) {
          if(exist || ["admin", "kristopolous", "anonymous"].indexOf(p.user) > 0) {
            socket.emit("user-error", {text: "Username " + p.user + " exists"});
          } else {
            User.register(p.user, p.password, p.email);
            login(p.user);
          }
        });
        // Reset
      } else {
        User.exists("email", p.email, function(exist) {
          if(!exist) {
            socket.emit("user-error", {text: p.email + " not registered"});
          } else {
            User.sendreset(p.email);
            socket.emit("user-error", {text: "password reset sent to " + p.email});
          }
        });
      }
      // login
    } else if(p.user) {
      User.exists("username", p.user, function(exists) {
        if(exists) {
          User.login(p.user, p.password, function(success) {
            if(success) {
              login(p.user);
            } else {
              socket.emit("user-error", {text: "Login Failed, Please Try Again"});
            }
          });
        } else {
          // The user doesn't exist, and they are not
          // trying to register it, so they get a free ride
          login(p.user);
        }
      }); 
      // logout
    } else {
      disconnect();
      _db.hdel("user", _user.uid);
    }
  });

  socket.on("get-all-videos", function() {
    _db.lrange("pl:" + _user.channel, 0, -1, function(err, list) {
      // This means an empty channel, it's probably an error
      // and we should probably handle it better than this.
      // But at least we aren't crashing.
      if(list.length == 0) {
        socket.emit("all-videos", {
          channel: _user.channel,
          data: [[]]
        });
        return;
      }
      _db.hmget("vid", list, function(err, allvideos) {
        for(var ix = 0; ix < allvideos.length; ix++) {
          allvideos[ix] = JSON.parse(allvideos[ix]);
          allvideos[ix].unshift(list[ix]);
        }
        socket.emit("all-videos", {
          channel: _user.channel,
          data: allvideos
        });
      });
    });
  });

  socket.on("chat", function(data) {
    // Insert images
    data.d = data.d.replace(/[a-z]+:\/\/[^\s^<]+(jpg|png|jpeg|gif|bmp|jpeg)/ig, '![]($&)');

    // Insert links
    data.d = data.d.replace(/([^(])(http[s]{0,1}:\/\/[^\s^<]+)/g, '$1[$2]($2)');
    data.d = data.d.replace(/^http[s]{0,1}:\/\/[^\s^<]+/g, '[$&]($&)');

    Chat.add(_user.channel, {
      type: "chat", 
      text: _md(data.d
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')),
      vid: data.vid, 
      who: _user.name,
      uid: _user.uid,
      color: _user.color,
      offset: data.offset
    });
  });

  setTimeout(function(){
    if(!_user.color) {
      socket.emit("greet-request");
    }
  }, 3000);
});
