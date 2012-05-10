var app = require('http').createServer(handler)
  , redis = require('redis')
  , _db = redis.createClient()
  , io = require('socket.io').listen(app)
  , _md = require("node-markdown").Markdown
  , fs = require('fs');

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
   [ "lPop", key]
  ]).exec();
}

io.sockets.on('connection', function (socket) {
  var 
    _user = {}, 
    _online = -1,
    _ival = {};

  socket.on("disconnect", function(){
    for(var which in _ival) {
      clearInterval(_ival[which]);
    };
  });

  function poll() {
    _db.get("mt80s:ix", function(err, last) {

      if(last <= _user.lastid) {
        return;
      }

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
              row[1] = _md(row[1]
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
              );
              chat.push(row);
            }
          })
          socket.emit("chat", chat);
          _user.lastid = last;
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

    if(_user.uid == 0) {
      _user.uid = uidgen();
      socket.emit("uid", _user.uid);
    } 

    if(!_ival.poll) {
      _ival.poll = setInterval(poll, 50);
      _ival.hb = setInterval(function(){
        // uid subject to change w/o notice
        var hb = "mt80s:hb:" + _user.uid;
        _db.multi([
          ["set", hb, 1],
          ["expire", hb, 10]
        ]).exec();
      }, 5000);
    }
  });

  socket.on("chat", function(p) {
    if(!p.d) {
      return;
    }

    _db.incr("mt80s:ix", function(err, id) {
      var payload = [ id, p.d, p.c, p.uid ];
      add("mt80s:log:" + p.chan, payload);
      add("mt80s:log:all", payload);
    });

  });
});
