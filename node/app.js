var app = require('http').createServer(handler)
  , mysql = require('mysql')
  , redis = require('redis')
  , _db = redis.createClient()
  , io = require('socket.io').listen(app)
  , _md = require("node-markdown").Markdown
  , fs = require('fs')
  , _mysql = mysql.createClient({
    user: 'php',
    password: 'fixy2k'
  });

_mysql.query("USE mt80s");

app.listen(1985);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function uidgen() {
  return (Math.random() * Math.pow(2,63)).toString(36);
}

function add(key, data) {
  _db.multi([
   [ "rpush", key, JSON.stringify(data) ],
   [ "ltrim", key, -15, -1]
  ]).exec();
}

var _channel = {
  create: function(params){
    console.log("Creating ", params);
    _mysql.query("insert into channel (name) values(" + _mysql.escape(params) + ")");
  },
  list: function(params) {
    _mysql.query("select cid, name from channel", function(err, res, fields) {
      console.log(res);
      console.log(fields);
    });
  },
  play: function(params) {
    _db.set("mt80s:request", JSON.stringify(params));
  }
};

io.sockets.on('connection', function (socket) {
  var 
    _user = {}, 
    _song = {},
    _online = -1,
    _ival = {};

  socket.on("disconnect", function(){
    for(var which in _ival) {
      clearInterval(_ival[which]);
    };
  });

  function hb() {
    // uid subject to change w/o notice
    var hb = "mt80s:hb:" + _user.uid;
    _db.multi([
      ["set", hb, 1],
      ["expire", hb, 10]
    ]).exec();
  }

  function song() {
    _db.get("mt80s:play:" + _user.channel, function(err, last) {
      var song = JSON.parse(last);
      if(song.rid == _song.rid) {
        return;
      } else {
        _song = song;
      }
      socket.emit("song", [
        song.rid,
        song.length,
        song.offset.toFixed(3),
        0,
        song.volume,
        song.artist,
        song.title,
        ""
      ]);
    });
  }

  function poll() {
    _db.get("mt80s:ix", function(err, last) {

      _db.lrange(
        "mt80s:log:" + _user.channel, 
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
            console.log(chat);
            socket.emit("chat", chat);
          }
        });
    });

    _db.keys("mt80s:hb:*", function(err, data) {
      var online = data.length;

      if(online != _online) {
        _online = online;
        socket.emit("stats", {online: online});
      }
    });
  }

  socket.emit("greet-request");

  socket.on("greet-response", function(p) {
    console.log("greet", p);

    _user = p;

    _mysql.query("select name from channel where cid = " + _mysql.escape(_user.channel), function(err, res, fields) {
      socket.emit("channel-name", res[0].name);
    });

    if(_user.uid == 0) {
      _user.uid = uidgen();
      socket.emit("uid", _user.uid);
    } 

    if(!_ival.poll) {
      _ival.poll = setInterval(poll, 50);
      _ival.hb = setInterval(hb, 5000);
      _ival.song = setInterval(song, 1000);
      song();
      hb();
    }
  });

  socket.on("channel", function(p) {
    if(_channel[p.action]) {
      _channel[p.action](p.params);
    }
  });

  socket.on("chat", function(p) {
    if(!p.d) {
      return;
    }

    _db.incr("mt80s:ix", function(err, id) {
      var payload = [ 
        id, 
        _md(p.d
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')),
        p.c, 
        p.uid 
      ];
      console.log("mt80s:log:" + _user.channel, payload);
      add("mt80s:log:" + _user.channel, payload);
      add("mt80s:log:all", payload);
    });

  });
});
