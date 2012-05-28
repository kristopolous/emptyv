var redis = require('redis')
  , _db = redis.createClient()
  , Channel = require('./channel')
  , Chat = require('./chat')
  , _last = +(new Date())
  , _state = {};

_db.select(1);
Channel.setDB(_db);
Chat.setDB(_db);

function build(channel) {
  _state[channel] = {
    name: channel,
    index: 0,
    video: {},
    requestStack: [],
    add: false
  };
}

function setVideo(channel, vid, offset, cb) {
  _db.hget("vid", vid, function(err, raw) {
    var full = JSON.parse(raw);
    if(!full) {
      console.log("error reading from " + channel);
      return;
    }
    _state[channel].video = {
      vid: vid,
      len: full[0],
      start: full[1],
      volume: full[2],
      artist: full[3],
      title: full[4],
      notes: full[5],
      offset: offset || full[1]
    };
    if(cb) {
      cb(_state[channel].video);
    }
  });
}

function addVideo(data, cb) {
  console.log("Adding " + data.vid);
  _db.hget("vid", data.vid, function(err, vid) {
    if(!vid) {
      _db.hset("vid", data.vid, JSON.stringify([
        data.len,   // Length of video
        0,          // Start at 0 for now 
        100,        // Full volume
        data.artist,// Put everything in the artist
        data.title, // Empty title
        "",         // Empty notes.
        data.name   // Adder.
      ]), cb);
    } else {
      // If it exists, still call the callback
      cb();
    }
  });
}

function setIndex(channel, index, offset) {
  // this is to survive a server crash
 _db.hset("tick", channel, [index, offset].join(','));
}

function loadVideo(channel, index, offset, quiet) {
  console.log("Loading " + channel + " " + index);
  _db.lindex("pl:" + channel, index, function(err, vid) {
    setVideo(channel, vid, offset, function(data) {
      setIndex(channel, index, data.start);
      _state[channel].index = index;
      if(!quiet) {
        var obj = {
          vid: vid,
          title: data.title,
          artist: data.artist
        };
        Chat.append("lastplayed:" + channel, obj);
        Channel.update(channel, obj);
      }
    });
  });
}

function getNext(row) {
  var video = row.requestStack.shift();

  // This means that the new video should
  // be appended to our playlist after the previous
  // video
  if(row.add) {
    if(row.previous) {
      _db.linsert(
        "pl:" + row.name,
        "AFTER",
        row.previous,
        row.video.vid
      );
    } else {
      _db.lpush(
        "pl:" + row.channel,
        row.video.vid
      );
    }
    row.previous = false;

    // And then we move the index forward
    // so that when we've exhausted our 
    // request stack we don't revisit the
    // stuff we are inserting
    row.index++;
    setIndex(row.name, row.index, 0);
  }
  if(video) {
    console.log(video);
    row.previous = row.video.vid;
    setVideo(row.name, video.vid, 0, function(){});
    row.add = video.add;
  } else {
    row.add = false;
    _db.llen("pl:" + row.name, function(err, len) {
      loadVideo(row.name, (row.index + 1) % len);
    });
  }
}

function doRequest(data, doadd) {
  // Putting it in the on-disk playlist is done
  // through the stack shifting logic
  console.log("Adding to the request stack");
  _state[data.channel].requestStack.push({
    vid: data.vid,
    name: data.name,
    add: doadd
  });
  Chat.add(data.channel, {
    type: 'request',
    artist: data.artist,
    title: data.title,
    id: data.vid,
    who: data.name
  });

  if(data.now) {
    console.log("Playing now");
    getNext(_state[data.channel]);
  }
}

_db.hgetall("tick", function(err, state) {
  for(var channel in state) {
    if (channel == '' || channel == '[object Object]') {
      Channel.remove(channel);
      continue;
    }
    Channel.update(channel, {name: channel});
    var position = state[channel].split(',');

    build(channel);

    loadVideo(
      channel, 
      parseInt(position[0]),
      parseInt(position[1]),
      true
    );
  }

  console.log("Up");
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

        if(data.action == 'skip') {
          Chat.add(data.channel, {
            type: 'skip',
            artist: data.track.artist,
            title: data.track.title,
            id: data.track.vid,
            who: data.name
          });

          getNext(_state[data.channel]);
        } else if(data.action == 'delist') {
          console.log("Delist", data);
          _db.lrem("pl:" + data.channel, 0, data.track.vid);
          Chat.add(data.channel, {
            type: 'delist',
            artist: data.track.artist,
            title: data.track.title,
            id: data.track.vid,
            who: data.name
          });
        } else {
          _db.lrange("pl:" + data.channel, 0, -1, function(res, list) {
            var offset = list.indexOf(data.vid);

            // See if its in thie channels playlist
            if(offset > -1) {

              doRequest(data, false);
            } else {
              addVideo(data, function(){

                if(!_state[data.channel] || !_state[data.channel].video.vid) {
                  console.log("Building channel: " + data.channel);
                  // This is a channel bootstrap
                  build(data.channel);
                  _db.lpush(
                    "pl:" + data.channel,
                    data.vid
                  );
                  loadVideo(data.channel, 0, 0);
                } else {
                  doRequest(data, true);
                }
              });
            } 
          });
        }
      });
    });

    for(channel in _state) {
      row = _state[channel]; 
      row.video.offset = (row.video.offset + delta);

      if((row.video.offset + 3) > row.video.len) {
        getNext(row);
      }

      // this is to survive a server crash
      setIndex(row.name, row.index, row.video.offset);

      //console.log(row);
      // this is for the consumer.
      _db.hset("play", row.name, JSON.stringify(row.video));
    }

    _last = now;
  }, 1000);
});
