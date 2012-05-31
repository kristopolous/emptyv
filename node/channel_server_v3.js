var redis = require('redis')
  , _db = redis.createClient()
  , Channel = require('./channel')
  , Chat = require('./chat')
  , PRELOAD = -(3)
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
    offset: 0,
    requestStack: [],
    add: false
  };
}

function setVideo(channel, vid, offset, cb, opts) {
  opts = opts || {};
  _db.hget("vid", vid, function(err, raw) {
    var full = JSON.parse(raw);
    if(!full) {
      console.log("error reading from " + channel);
      return;
    }
    _state[channel].video = {
      vid: vid,
      len: parseInt(full[0]),
      start: full[1],
      volume: full[2],
      artist: full[3],
      title: full[4],
      notes: full[5],
      offset: parseInt(offset || full[1])
    };
    if(cb) {
      cb(_state[channel].video);
    }
    if(!opts.quiet) {
  
      Chat.add(channel, {
        type: 'play',
        artist: full[3],
        title: full[4],
        id: vid
      });
   
      Chat.append(
        "lastplayed:" + channel, 
        Channel.update(channel, {
          vid: vid,
          title: full[4],
          artist: full[3]
        })
      );
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

function loadVideo(channel, index, offset, opts) {
  if (arguments.length == 2) {
    offset = PRELOAD;
  }
  console.log("Loading " + channel + " " + index);
  _db.lindex("pl:" + channel, index, function(err, vid) {
    setVideo(channel, vid, offset, function(data) {
      setIndex(channel, index, data.start);
      _state[channel].index = index;
    }, opts);
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
    setIndex(row.name, row.index, PRELOAD);
  }
  if(video) {
    console.log(video);
    row.previous = row.video.vid;
    setVideo(row.name, video.vid, PRELOAD);
    row.add = video.add;
  } else {
    row.add = false;
    _db.llen("pl:" + row.name, function(err, len) {
      loadVideo(row.name, (row.index + 1) % len);
    });
  }
}

function delist(data) {
  // Redis' api is stupid here.
  // really crappy.

  // First we need a reference point, for later verification
  // when it comes to the possibility of resetting an index
  // or not.
  var 
    refPoint = _state[data.channel].previous || _state[data.channel].video.vid,
    currentIndex = _state[data.channel].index,
    channel = data.channel;

  console.log("Removing " + data.track.vid + " from " + channel);
  // Now we need to remove the entry from the playlist by
  // its content, not its index.
  _db.lrem("pl:" + channel, 0, data.track.vid, function(err, last) {
    //
    // After the content has been removed we need to now know whether our
    // reference pointer needs to go behind, be reset, or stay put.
    //
    // If our refPoint is the same as our data.track.vid, that is to say
    // that we are delisting the video that is being currently watched, 
    // then all we need to do is keep the index as is, and reset the
    // offset counter, re-emitting the index, which is at the new content.
    // 
    if(refPoint == data.track.vid) {
      console.log("That was our current video, resetting to the new index");
      loadVideo(channel, currentIndex);
      return;
    }

    // Otherwise, we need to query the database, at the index 
    // that we previously knew.
    _db.lindex("pl:" + channel, currentIndex, function(err, last) {
      //
      // If the content at the previous index is the same as the refpoint
      // content, that means that the delisting happened after the current
      // position. We don't have to do anything.
      //
      // However, if the content at the previous index is different, then
      // that means that the deletion happened prior to the refpoint content
      // and so therefore we need to back up one. Of course we are assuming
      // that we aren't backing up to -1. I think this is not possible here.
      //
      // Absofuckinglutely insane.
      //
      if(last != refPoint) {
        console.log("That was an earlier index, tracking back");
        _state[channel].index -= 1;
        setIndex(channel, _state[channel].index, _state[channel].offset);
      } else {
        console.log("That was a later index, everything is gravy");
      }
    });
  });
}

function updateNext(channel) {
}

function doRequest(data, doadd) {
  // Putting it in the on-disk playlist is done
  // through the stack shifting logic
  console.log("Adding to the request stack");
  
  // If the user said "play now" then this 
  // requested video goes to the front of the stack,
  // not the end. (2012-05-30 cjm)
  var func = data.now ? "unshift" : "push";

  _state[data.channel].requestStack[func]({
    vid: data.vid,
    name: data.name,
    add: doadd
  });

  updateNext(data.channel);

  Chat.add(data.channel, {
    type: 'request',
    artist: data.artist,
    title: data.title,
    id: data.vid,
    uid: data.uid,
    who: data.name
  });

  if(data.now) {
    console.log("Playing now");
    getNext(_state[data.channel]);
  }
}

function requestProcessor() {
  _db.lrange("request", 0, -1, function(err, request) {
    _db.del("request");
    request.forEach(function(row) {
      var data = JSON.parse(row);

      if(data.action == 'skip') {
        // Only skip the video if its currently still playing.
        if(data.vid == _state[data.channel].video.vid) {
          Chat.add(data.channel, {
            type: 'skip',
            artist: _state[data.channel].video.artist,
            title: _state[data.channel].video.title,
            id: data.vid,
            uid: data.uid,
            who: data.name
          });

          getNext(_state[data.channel]);
        }
      } else if(data.action == 'delist') {
        console.log("Delist", data);

        delist(data);

        Chat.add(data.channel, {
          type: 'delist',
          artist: data.track.artist,
          title: data.track.title,
          id: data.track.vid,
          uid: data.uid,
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
                loadVideo(data.channel, 0);
              } else {
                doRequest(data, true);
              }
            });
          } 
        });
      }
    });
  });
}

function channelUpdate(channelList) {
  var 
    now = +(new Date()),
    delta = (now - _last) / 1000;

  requestProcessor();
  channelList.forEach(function(channel) {
    if(!_state[channel]) {
      build(channel);
      return;
    } 
    var row = _state[channel]; 
    row.video.offset = row.video.offset + delta;

    if((2.5 + row.video.offset - PRELOAD) > row.video.len) {
      getNext(row);
    }

    console.log(row.video.offset, row.video.len);
    // this is to survive a server crash
    setIndex(row.name, row.index, row.video.offset);

    // this is for the consumer.
    _db.hset("play", row.name, JSON.stringify(row.video));
  });

  _last = now;
}

_db.hgetall("tick", function(err, state) {
  for(var channel in state) {
    var position = state[channel].split(',');
    for(var ix = 0; ix < position.length; ix++){
      position[ix] = parseInt(position[ix]);
      if(isNaN(position[ix])) {
        position[ix] = 0;
      }
    }

    build(channel);

    loadVideo(
      channel, 
      position[0],
      position[1],
      {quiet: true}
    );
  }
  console.log("Up");

  setInterval(function(){
    Channel.getAll(channelUpdate);
  }, 1000);
});
