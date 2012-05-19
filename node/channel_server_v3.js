var redis = require('redis')
  , _db = redis.createClient()
  , _last = +(new Date())
  , _state = {};

_db.select(1);

function add(key, data) {
  _db.multi([
   [ "rpush", key, JSON.stringify(data) ],
   [ "ltrim", key, -9, -1]
  ]).exec();
}

function loadVideo(channel, index, offset, quiet) {
  _db.lindex("pl:" + channel, index, function(err, vid) {
    _db.hget("vid", vid, function(err, raw) {
      var full = JSON.parse(raw);
      console.log(vid, raw);
      _state[channel] = {
        name: channel,
        index: index,
        video: {
          vid: vid,
          len: full[0],
          start: full[1],
          volume: full[2],
          artist: full[3],
          title: full[4],
          notes: full[5],
          offset: offset || full[1]
        },
      };
      if(!quiet) {
        add("lastplayed:" + channel, {
          vid: vid,
          title: full[4],
          artist: full[3]
        });
      }
    });
  });
}

_db.hgetall("tick", function(err, state) {
  for(var channel in state) {
    var position = state[channel].split(',');

    loadVideo(
      channel, 
      parseInt(position[0]),
      parseInt(position[1]),
      true
    );
  }
});


function go2(row, index) {
  loadVideo(row.name, index);
}

function getNext(row) {
  _db.llen("pl:" + row.name, function(err, len) {
    go2(row, (row.index + 1) % len);
  });
}

setInterval(function(){
  var 
    now = +(new Date()),
    channel,
    row,
    delta = (now - _last) / 1000;

  _db.lrange("request", 0, -1, function(err, request) {
    _db.del("request");
    request.forEach(function(row) {
      var data = JSON.parse(row);

      _db.lrange("pl:" + data.channel, 0, -1, function(res, list) {
        var offset = list.indexOf(data.vid);

        // See if its in thie channels playlist
        if(offset > -1) {

          go2(_state[data.channel], offset);

        } else {
          // otherwise use the len property
          // to test whether it was a local
          // or a remote result

          if (data.len) {
            _db.hset("vid", data.vid, JSON.stringify([
              data.len,   // Length of video
              0,          // Start at 0 for now 
              100,        // Full volume
              data.artist,// Put everything in the artist
              data.title, // Empty title
              ""          // Empty notes.
            ]));
          }

          // Now put it in our playlist
          // AFTER the current video.
          _db.linsert(
            "pl:" + data.channel,
            "AFTER",
            _state[data.channel].video.vid,
            data.vid, function(res, list) {
              // And then go to it.
              getNext(_state[data.channel]);
            }
          );
        } 
      });
    });
  });

  for(channel in _state) {
    row = _state[channel]; 
    row.video.offset = (row.video.offset + delta);

    if((row.video.offset + 8) > row.video.len) {
      getNext(row);
    }

    console.log(row);
    // this is to survive a server crash
    _db.hset("tick", row.name, [row.index, row.video.offset].join(','));

    // this is for the consumer.
    _db.hset("play", row.name, JSON.stringify(row.video));
  }

  _last = now;
}, 1000);
