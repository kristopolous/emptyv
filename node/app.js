var app = require('http').createServer(function(){})
  , redis = require('redis')
  , _db = redis.createClient()
  , io = require('socket.io').listen(app)
  , _md = require("node-markdown").Markdown
  , VERSION = 2
  , fs = require('fs');

_db.select(1);
app.listen(1985);

function uidgen() {
  return (Math.random() * Math.pow(2,63)).toString(36);
}

function add(key, data, width) {
  width = width || 20;
  _db.multi([
   [ "rpush", key, JSON.stringify(data) ],
   [ "ltrim", key, -width, -1]
  ]).exec();
}

io.sockets.on('connection', function (socket) {
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
      _db.sadd("user:" + which, _user.uid);
    },

    leave: function() {
      _db.srem("user:" + _user.channel, _user.uid);
    },

    play: function(params) {
      _db.set("request", JSON.stringify(params));
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

    _db.scard("user:" + _user.channel, function(err, online) {
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

    _channel.join("80smtv");

    if(!_user.uid) {
      _user.uid = uidgen();
      socket.emit("uid", _user.uid);
    } else {
      _db.hget("user", _user.uid, function(err, last) {
        if(last) {
          _user.name = last;
          socket.emit("username", _user.name);
          announce(_user.name + " logged in");
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

  socket.on("set-user", function(p) {
    if(p.user) {
      if(_user.name != "anonymous") {
        announce(_user.name + " is now known as " + p.user);
      } else {
        announce(p.user + " logged in");
      }
      _user.name = p.user;
      _db.hset("user", _user.uid, p.user);
      socket.emit("username", _user.name);
    } else {
      announce(_user.name + " logged out");
      _user.name = "anonymous";
    }
  });

  function announce(message) {
    _db.incr("ix", function(err, id) {
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

    _db.incr("ix", function(err, id) {
      var payload = [ 
        id, 
        _md(p.d
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
