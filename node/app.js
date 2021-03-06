var app = require('http').createServer(function(){})
  , redis = require('redis')
  , _db = redis.createClient()
  , _pubsub = redis.createClient()
  , _sub = redis.createClient()
  , _md = require("node-markdown").Markdown
  , IO = require('socket.io').listen(app)
  , QS = require('querystring')
  , Chat = require('./chat')
  , Channel = require('./channel')
  , User = require('./user')
  , HTTP = require('http');

_db.select(1);
_pubsub.select(1);
_sub.select(1);
app.listen(1985);

Channel.setDB(_db);
Chat.setDB(_db, _pubsub);
//IO.set('log level', 1);

function uidgen() {
  return (Math.random() * Math.pow(2,63)).toString(36);
}

var remote = (function(){
  function remote_base(pre, post, cb) {
    var 
      path = '/feeds/api/videos' + pre + '?' + QS.stringify({
        alt: 'json',
        v: 2,
        format: 5
      }),
      resultList = [],
      req;

    if(post) {
      path += '&' + QS.stringify(post);
    }
    req = HTTP.request({
      host: 'gdata.youtube.com',
      path: path
    }, function(res) {
      res.setEncoding('utf8');
      res.on('data', function(data) { resultList.push(data); });
      res.on('end', function(){ cb(JSON.parse(resultList.join(''))); });
    });

    req.on('error', function(){ cb(false); });
    req.end();
  }

  return {
    query: function(query, cb) {
      remote_base("", {
        q: query,
        orderby: 'relevance',
        'max-resultList': 25
      }, cb);
    },

    degrade: function(data) {
      var 
        artist,
        vid,
        split,
        resultList = [], 
        title;

      data.feed.entry.forEach(function(result) {
        split = result.title.$t.split(' - ');
        if(split.length == 1) {
          artist = "";
          title = split[0];
        } else {
          artist = split.shift();
          title = split.join(' - ');
        }
        vid = 'yt:' + result.media$group.yt$videoid.$t;
        resultList.push({
          vid: vid,
          title: title,
          artist: artist,
          len: result.media$group.yt$duration.seconds
        });
      });
      return resultList;
    },

    related: function(ytid, cb) {
      remote_base('/' + ytid + '/related', '', cb);
    }
  };
})();

function search(query, cb) {
  var 
    local = [],
    resultList = [], 
    idList = [];

  remote.query(query, function(data) {
    if(data.feed.entry) {
      resultList = remote.degrade(data);
      idList = resultList.map(function(which) { return which.vid });
    }
      
    _db.hmget("vid", idList, function(err, data) {
      if(data) {
        for(var ix = data.length - 1; ix >= 0; ix--) {
          if(data[ix]) {
            local.push(resultList[ix]);
            resultList.splice(ix, 1);
          }
        }
      }
      cb(false, {
        local: local,
        remote: resultList,
        total: local.length + resultList.length
      });
    });
  });
}

IO.sockets.on('connection', function (socket) {
  var 
    _user = {greeted: false}, 
    _song = {},
    _online = -1,
    _ival = {};

  var _channel = {

    emitlog: function(which) {
      _db.lrange(
        "log:" + which, 
        0, -1, 
        function(err, data) {
          socket.emit("chat", data.map(function(which) { return JSON.parse(which); }));
        });
    },

    join: function(which) {
      Channel.get(which, function(){
        _channel.leave(function(){
          Channel.join(which, _user.uid, function(){
            // This resets the id counter so we get a full chat
            _user.lastid = 0;
            if(_user.loggedin) {
              if ( _user.channel && (_user.channel != which)) {
                announce(_user.name + " left and went to <a href=#" + escape(which) + ">" + which + "</a>.");
              }
              announce(_user.name + " joined", which);
            }
            _user.channel = which;
            socket.emit("channel-name", which);
            _channel.emitlog(which);
            _sub.subscribe("pub:log:" + which);
          });
        });
      });
    },

    leave: function(cb) {
      Channel.leave(_user.channel, _user.uid, cb);
      _sub.unsubscribe("pub:log:" + _user.channel);
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
        socket.emit("song", song);
      }
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
    var context = (channel || _user.channel);
    if(context) {
      Chat.add(
        context, {
          type: 'announce',
          text: message,
          uid: _user.uid
        }
      );
    }
  }

  function login(name) {
    _user.loggedin = true;
    _user.name = name;
    announce(name + " logged in");
    _db.hset("user", _user.uid, name);
    socket.emit("username", name);
  }

  socket.on("disconnect", function(){
    disconnect();
    for(var which in _ival) {
      clearInterval(_ival[which]);
    };
    _channel.leave();
  });

  socket.on("get-related", function(obj) {
    remote.related(obj.ytid, function(results) {
      socket.emit("related-results", {
        ytid: obj.ytid,
        results: remote.degrade(results)
      });
    });
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

  socket.on("playlist", function(obj) {
    var start = (+new Date());
    Channel.getPlaylist(obj, function(list) {
      obj.result = list;
      socket.emit("playlist", obj);
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

    if(!_ival.song) {
      _ival.song = setInterval(song, 1000);
      song();
    }
  });

  _sub.on("message", function(channel, message) {
    socket.emit("chat", [JSON.parse(message)]);
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
    _db.lrange("prev:" + chan, 0, -1, function(err, last){
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

  socket.on("set-user", function(p) {
    if(p.user) {
      // Prevent xss
      p.user = p.user.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    // Either a registeration or a reset
    if(p.email) {
      // Registration
      if(p.user) {
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

  socket.on('ping', function() {
    console.log('pong');
  });

  socket.on("get-all-videos", function(start, end) {
    Channel.getLibrary(_user.channel, start, end, function(obj) {
      console.log(obj);
      _db.hmget("vid", obj.data, function(err, allvideos) {
        for(var ix = 0; ix < allvideos.length; ix++) {
          allvideos[ix] = JSON.parse(allvideos[ix]);
          allvideos[ix].unshift(obj.data[ix]);
        }
        socket.emit("all-videos", {
          len: obj.len,
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
