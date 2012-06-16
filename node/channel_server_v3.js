var redis = require('redis')
  , _db = redis.createClient()
  , _pubsub = redis.createClient()
  , Channel = require('./channel')
  , Chat = require('./chat')
  , PRELOAD = -(3)
  , fs = require('fs')
  , _last = +(new Date())
  , _state = {};

_db.select(1);
_pubsub.select(1);
Channel.setDB(_db, _pubsub);
Chat.setDB(_db, _pubsub);

function build(channel) {
  _state[channel] = {
    name: channel,
    index: 0,
    video: {},
    offset: 0,
    add: false
  };
}

function sync(who){
  _db.set("p:" + who, JSON.stringify(_state[who].playlist));
}

function setVideo(channel, vid, offset, opts) {
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
      index: _state[channel].index,
      offset: parseInt(offset || full[1])
    };

    if(!opts.quiet) {
  
      Chat.add(channel, {
        type: 'play',
        artist: full[3],
        title: full[4],
        id: vid
      });
    }
    Chat.append(
      "prev:" + channel,
      Channel.update(channel, {
        vid: vid,
        artist: full[3],
        title: full[4]
      })
    );
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

function loadVideo(channel, index, offset, opts) {
  if (arguments.length == 2) {
    offset = PRELOAD;
  }
  console.log("Loading " + channel + " " + index);

  _state[channel].index = index;
  setVideo(channel, _state[channel].playlist[index], offset, opts);
}

function getNext(row) {
  _db.lpop("re:" + row.name, function(err, video){

    // This means that the new video should
    // be appended to our playlist after the previous
    // video
    if(row.add) {
      console.log(row);
      if(row.previous) {
        row.playlist.splice( 
          row.playlist.indexOf(row.previous),
          0,
          row.video.vid
        );
      } else {
        row.playlist.push(row.video.vid);
      }
      sync(row.name);
      row.previous = false;

      // And then we move the index forward
      // so that when we've exhausted our 
      // request stack we don't revisit the
      // stuff we are inserting
      row.index++;
    }
    if(video) {
      video = JSON.parse(video);
      row.previous = row.video.vid;
      setVideo(row.name, video.vid, PRELOAD);
      row.add = video.add;
    } else {
      row.add = false;
      loadVideo(row.name, (row.index + 1) % row.playlist.length);
    }
  });
}

function delist(del) {
  // First we need a reference point, for later verification
  // when it comes to the possibility of resetting an index
  // or not.
  var 
    channel = del.channel,
    refPoint = _state[channel].previous || _state[channel].video.vid,
    currentIndex = _state[channel].index,
    offset = _state[channel].playlist.indexOf(del.track.vid);

  console.log("Removing " + del.track.vid + " from " + channel);
  // Now we need to remove the entry from the playlist by
  // its content, not its index.
  
  _state[channel].playlist.splice(offset, 1);
  sync(channel);
  //
  // After the content has been removed we need to now know whether our
  // reference pointer needs to go behind, be reset, or stay put.
  //
  // If our refPoint is the same as our del.track.vid, that is to say
  // that we are delisting the video that is being currently watched, 
  // then all we need to do is keep the index as is, and reset the
  // offset counter, re-emitting the index, which is at the new content.
  // 
  if(_state[channel].video.vid == del.track.vid) {
    console.log("That was our current video, resetting to the new index");
    loadVideo(channel, currentIndex);
    return;
  }

  // Otherwise, we need to query the database, at the index 
  // that we previously knew.
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
  if(_state[channel].playlist[currentIndex] != refPoint) {
    console.log("That was an earlier index, tracking back");
    _state[channel].index -= 1;
    setIndex(channel, _state[channel].index, _state[channel].offset);
  } else {
    console.log("That was a later index, everything is gravy");
  }
}

function doRequest(data, doadd) {
  // Putting it in the on-disk playlist is done
  // through the stack shifting logic
  console.log("Adding to the request stack");
  
  // If the user said "play now" then this 
  // requested video goes to the front of the stack,
  // not the end. (2012-05-30 cjm)
  var func = data.now ? "lpush" : "rpush";

  _db[func]("re:" + data.channel, JSON.stringify({
    vid: data.vid,
    name: data.name,
    add: doadd
  }));

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
        var offset = _state[data.channel].playlist.indexOf(data.vid);

        // See if its in thie channels playlist
        if(offset > -1) {

          doRequest(data, false);
        } else {
          addVideo(data, function(){

            if(!_state[data.channel] || !_state[data.channel].video.vid) {
              console.log("Building channel: " + data.channel);
              // This is a channel bootstrap
              build(data.channel);
              _state[data.channel].playlist = [data.vid];
              sync(data.channel);
              loadVideo(data.channel, 0);
            } else {
              doRequest(data, true);
            }
          });
        } 
      }
    });
  });
}

function eventloop(){
  console.log("Up");
  setInterval(function(){
    Channel.getAll(function(channelList) {
      var 
        now = +(new Date()),
        delta = (now - _last) / 1000;

      requestProcessor();
      channelList.forEach(function(channel) {
        var row = _state[channel]; 
        if(!row) {
          build(channel);
          return;
        } 

        row.video.offset = row.video.offset + delta;

        if((2.5 + row.video.offset - PRELOAD) > row.video.len) {
          getNext(row);
        }

        _db.hset("play", row.name, JSON.stringify(row.video));
      });

      _last = now;
    });
  }, 1000);

  setInterval(function(){
    Channel.generate(function(data) {
      // Top 8.
      data = data.slice(0,7);

      _db.lrange("logall", 0, -1, function(err, last) {

        last = last.map(function(x){ return JSON.parse(x); });
        fs.writeFile("../baked/channels.js", "Channel.splashshow(" + JSON.stringify({
          chan: data,
          chat: last
        }) + ")");
      });
    });
  }, 5000);
}

_db.hgetall("play", function(err, state) {
  var toLoad = 0;

  Object.keys(state).forEach(function(channel) {
    var position = JSON.parse(state[channel]);

    if ("index" in position) {
      toLoad++;
    }

    if ("index" in position) {
      _db.get("p:" + channel, function(err, last) {
        build(channel);
        _state[channel].playlist = JSON.parse(last);

        loadVideo(
          channel, 
          position.index,
          position.offset,
          {quiet: true}
        );
        toLoad--;
        if(toLoad == 0) {
          eventloop();
        }
      });
    }
  });
});
