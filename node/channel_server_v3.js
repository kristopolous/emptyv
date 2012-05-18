var redis = require('redis')
  , _db = redis.createClient()
  , _last = +(new Date())
  , _state = {};

_db.select(1);

function add(key, data) {
  _db.multi([
   [ "rpush", key, JSON.stringify(data) ],
   [ "ltrim", key, -20, -1]
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
        _db.incr("ix", function(err, chat_id) {
          var id = vid.split(':').pop();

          add("log:" + channel, [
            chat_id,
              "<a class=title target=_blank href=http://youtube.com/watch?v=" + id + ">" + 
               "<img src=http://i3.ytimg.com/vi/" + id + "/default.jpg>" +
               "<span>" +
                 "<b>" + full[3] + "</b>" +  
                 full[4] +
               "</span>" +
             "</a>",
           0,
           ""
          ]);
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
      position[0],
      parseInt(position[1]),
      true
    );
  }
});


function getNext(row, cb) {
  _db.llen("pl:" + row.name, function(err, len) {
    row.index = (row.index + 1) % len;
    loadVideo(row.name, row.index);
  });
}

setInterval(function(){
  var 
    now = +(new Date()),
    channel,
    row,
    delta = (now - _last) / 1000;

  for(channel in _state) {
    row = _state[channel]; 
    row.video.offset = (row.video.offset + delta);

    if(row.video.offset > row.video.len) {
      getNext(row);
    }

    console.log(row);
    // this is to survive a server crash
    _db.hset("tick", row.name, [row.index, row.video.offset].join(','));

    console.log(row.name, row.video);

    // this is for the consumer.
    _db.hset("play", row.name, JSON.stringify(row.video));
  }

  _last = now;
}, 1000);
