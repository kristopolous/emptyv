var scripts = [
  [0, 'js/underscore-min.js'],
  [10, 'js/jquery-1.7.1.min.js'],
  [5000, 'js/jquery-ui-1.8.20.custom.min.js']
];

for(var i = 0; i < scripts.length; i++) {
  (function(row){
    setTimeout(function(){
      log("Loading " + row[1]);
      var ga = document.createElement('script');
      ga.type = 'text/javascript';
      ga.src = row[1];
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(ga, s);
    }, row[0]);
  })(scripts[i]);
}

var
  DUMMYFUNCTION = function(){},

  ID = 0,

  CHANNEL = (document.location.search.length > 0) ? 
     document.location.search.substr(1)
   : navigator.language.split('-')[0],

  CHANNEL_CURRENT = CHANNEL,

  UID = Store("uid") || 0,

  MYCOLOR = Math.floor(Math.random() * 9),

  // This is the duration of the video minus the offsets in
  // the start and stop, as determined through visual inspection.
  // These are the transitions put on by different uploaders, things
  // like "THIS IS A JJ COOLGUY RIP" etc.
  RUNTIME = 1,
  START = 2,
  STOP = 3,

  // This is for volume normalization on a per video
  // basis
  VOLUME = 4,

  // The year of release
  YEAR = 5,

  ARTIST = 6,

  TITLE = 7,

  NOTES = 8,

  OFFSET = 9,

  COMMERCIAL_sec = 30, 

  // If there is a hash value (there should not be regularly)
  // Then debugging output is turned on, whatever the hell that
  // entails
  DEBUG = location.hash.search("DEBUG") > -1,

  // The offset addition was after some toying around and 
  // seeint how long the player took to load. This seemed
  // to work ok; we really want the drift to be as close
  // to 0 as possible.
  LOADTIME_sec = 5,

  // According to the docs: "The player does not request 
  // the FLV until playVideo() or seekTo() is called.". In
  // order to combat this, we have to pre-load the video
  // by some increment, we take that to be the LOADTIME,
  // multiplied by 1000 because it's expressed in MS
  PRELOAD_ms = LOADTIME_sec * 1000,

  LAG_THRESHHOLD = 12,

  // An extra player
  EXTRA = 2,

  NEXTVIDEO_PRELOAD = 3,

  LASTMESSAGE = "",
  LASTTITLE = "",

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium", "large"]; //, "hd720", "hd1080", "highres"];

// }} // Constants

// This is for IE
if (typeof console == "undefined") {
  self.console = {log: new Function()}
}

self.indexOf = function(array, item) {
  for(var ix = 0; ix < array.length; ix++) {
    if(array[ix] == item) {
      return ix;
    }
  }
  return -1;
}

// Utils {{
function linkify(f) {
  if (f && f.replace) {
    return f.replace(/[a-z]+:\/\/[^\s^<]+/g, '<a href="$&" target=_blank>$&</a>').replace(/\n/g, '<br>');
  }
  return f;
}

function getNow(offset) {
  return +(new Date() / 1000) + (offset || 0);
}

function remainingTime(player) {
  if(player) {
    return Math.max(0,
      player.getDuration() - 
      _duration[player.index][STOP] - 
      player.getCurrentTime()
    );
  } else {
    return 0;
  }
}

function image(id) {
  return "http://i3.ytimg.com/vi/" + id.split(":").pop() + "/default.jpg>";
}

function toTime(sec) {
  return [
    Math.floor(sec / 3600),
    (Math.floor(sec / 60) % 60 + 100).toString().substr(1),
    ((Math.floor(sec) % 60) + 100).toString().substr(1)
  ].join(':');
}

function hide(player) {
  if(player && player.style) {
    player.style.left = "-200%";
  }
}

function show(player) {
  if(player && player.style) {
    player.style.left = 0;
  }
}

function log() {
  console.log([
    (getNow() - _start).toFixed(4),
    Array.prototype.slice.call(arguments).join(' ')
  ].join(' '));
} 

// }} // Utils


// Globals {{
var 
  _active = -1,

  _chat = {
    data: [],
    lastid: 0,
    datatimeout: null
  },

  // This the the current playback quality index, which can be triggered
  // in a direction (either up or down) based on how successful we can
  // combat drift (basically by playing without hitting a buffer interval)
  //
  // We start at medium quality and then the skies the limit, I guess.
  _currentLevel = 1,
  
  _db = DB().insert(
    DB.objectify(
      ["id", "length", "start", "end", "volume", "year", "artist", "title"], 
      _duration
    )
  ),

  // The lag counter is a token system that gets set by an interval.  If
  // we accumulate a certain negative or positive balance, then we can exchange
  // the negative or positive units for a quality shift. This makes sure that 
  // we can prove the stability of any setting through successive incremental
  // sampling
  _lagCounter = 0,

  _volume = Store("volume") || 1,

  _ev = EvDa(),

  _index = -1,
  _lastLoaded,

  _seekTimeout = 0,
  _qualityTimeout = 0,

  _driftcounter = 0,
  _drift,
 
  // The epoch time is based off the system time AND the users
  // local clock.  This makes sure that separate clock drifts
  // are *about* the same ... minus the TTL latency incurred by
  // the emit from the server of course (which we assume to be fairly
  // constant).
  _start = getNow(),
  _epoch = 1325778000 + ( _start - _referenceTime ),

  _bAppend = true,
  _offsetIval,

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],
  _playerPrev, 
  _playerByDom = {yt:[], dm:[]},
  _playerById = {},

  _lastTime = 0,

  _next = 0,
  _runtime = 0;

for(var ix = 0; ix < _duration.length; ix++) {
  _duration[ix][OFFSET] = _runtime;
  _runtime += _duration[ix][RUNTIME] - NEXTVIDEO_PRELOAD;
}

_db.find().each(function(which) {
  which.ix = index;
  which.full = [which.artist, which.title].join(' - ');
});
var index = 0;
_db.find().update({ix: function() {return index++ }});

// }} // Globals

function Store(key, value) {
  if(self.localStorage) {
    if(arguments.length == 2) {
      localStorage[key] = value;
    }
    return localStorage[key];
  }
}

function setVolume(amount, animate) {
  _volume = amount;

  Store("volume", _volume);

  var volume = 100;

  if ("index" in _player[_active]) {
    volume = _duration[_player[_active].index][VOLUME] * _volume;
  }
  if(animate) {
    $("#mute").animate({top: (1 - _volume) * 100});
  }
  _playerPrev[_active].setVolume(volume * _volume);
}

function secondarySwap(){
  var swapInterval = setInterval(function(){
    if (_playerById[_index].getCurrentTime() < _player[EXTRA].getCurrentTime()) {

      // Nows our time to shine
      _playerById[_index].playVideo();
      _playerById[_index].setVolume(_duration[_index][VOLUME] * _volume);
     
      // Bring the volume up of the higher quality player and mute the current
      _player[EXTRA].setVolume(0);
      _player[EXTRA].stopVideo();

      // Show the higher quality and hide the current one
      hide(_player[EXTRA]);
      show(_player[_active]);

      // And then clear the polling interval
      clearInterval(swapInterval);
    }
  }, 10);
}

// This sets the quality of the video along with
// supporting going down or up a notch based on
// what is detected, probably in findOffset
function setQuality(direction) {
  var 
    supported = true,

    newQualityIndex = _currentLevel,
    newQualityWord,
                    
    activeAvailable = _playerById[_index].getAvailableQualityLevels().reverse(),
    activeQualityWord = _playerById[_index].getPlaybackQuality();

  // If no video is loaded, then go no further.
  if(activeAvailable.length === 0) {
    return;
  }

  // For certain EMI and Polydor muted tracks, 240p (small) works
  // ok for youtube ... we put 240p in the notes section if this is
  // the case.
  if(_duration[_index][NOTES].search("240p") > 0) {
    // If this is the case, then we limit ourselves to just the 
    // lowest quality video
    activeAvailable = ["small"];
  }

  if(direction === -1) {
    _qualityTimeout = 2 * LOADTIME_sec + getNow();
  } else if (direction > 0 && getNow() < _qualityTimeout) {
    return;
  }

  // If the lapse has dropped and the direction is specific
  if(direction) {
    newQualityIndex = Math.min(
      Math.max(_currentLevel + direction, 0),
      LEVELS.length
    );
  }

  // Now that we have the destination quality level, we need to see
  // if the current video playing has this quality level.
  newQualityWord = LEVELS[newQualityIndex];

  // If this video doesn't support the destination quality level
  if ( indexOf(activeAvailable, newQualityWord) === -1) {
    log("NOT SUPPORTED", newQualityWord, activeAvailable);

    // Use the highest one available (the lower ones are always available)
    // Get the word version of the highest quality available
    newQualityWord = activeAvailable[activeAvailable.length - 1];

    // state that we are downsampling because of an incompatibility
    supported = false;
  }

  // If this new, supported quality isn't the current one set
  if (newQualityWord !== activeQualityWord) {

    log("Quality: " + activeQualityWord + " => " + newQualityWord);

    // If we are downsampling then just do it
    if(direction < 0) {
      // we also shuffle the placement forward to accomodate for the change over
      _playerById[_index].seekTo(_playerById[_index].getCurrentTime() + LOADTIME_sec);
      _playerById[_index].setPlaybackQuality(newQualityWord);

      // If we are upsampling, then do it seemlessly.
    } else if( 
      _playerById[_index].getDuration() - 
      _duration[_index][STOP] - 
      _playerById[_index].getCurrentTime() > LOADTIME_sec * 2.5
    ) {

      // First, load the active video in the extra player,
      // setting the volume to 0
      _player[EXTRA].loadVideoById(
        _duration[_index][ID].split(":")[1], 
        _playerById[_index].getCurrentTime() + LOADTIME_sec
      );

      _player[EXTRA].setVolume(0);
      _player[EXTRA].pauseVideo();

      // Set the playback quality of the extra video to the higher
      // quality
      _player[EXTRA].setPlaybackQuality(newQualityWord);

      // Now poll the two time offsets and swap videos when they cross
      var swapInterval = setInterval(function(){

        if (
          (_player[EXTRA].getCurrentTime() > 0) &&
          (_playerById[_index].getCurrentTime() > _player[EXTRA].getCurrentTime())
        ) {
          // Nows our time to shine
          // Start the higher quality player and stop the current one
          _player[EXTRA].playVideo();
          var myplayer = _playerById[_index];
          setTimeout(function(){
            // Show the higher quality and hide the current one
            hide(_player[_active]);
            show(_player[EXTRA]);

            // Bring the volume up of the higher quality player and mute the current
            _player[EXTRA].setVolume(_duration[_index][VOLUME] * _volume);
            myplayer.setVolume(0);
            myplayer.seekTo(_player[EXTRA].getCurrentTime() + 3.5);
            myplayer.setPlaybackQuality(newQualityWord);
            secondarySwap();
          }, 500);

          // And then clear the polling interval
          clearInterval(swapInterval);
        }
      }, 10);

      // And set it as the default, but only if this isn't
      // a forced down-sampling because of available quality
      // limitations.
      if(supported) {
        _currentLevel = indexOf(LEVELS, newQualityWord);
      }
    } 
  }
}

function doTitle(){
  if(_bAppend) {
    var newtitle = _duration[_index][ARTIST] + " - " + _duration[_index][TITLE];
    if(LASTTITLE != newtitle) {
      LASTTITLE = newtitle;
      var dom = "<a class=title target=_blank href=http://youtube.com/watch?v=" + _duration[_index][ID].split(':')[1] + ">" + 
         "<img src=http://i3.ytimg.com/vi/" + _duration[_index][ID].split(":").pop() + "/default.jpg>" +
         "<span>" +
           "<b>" + _duration[_index][ARTIST] + "</b>" +  
           _duration[_index][TITLE] +
         "</span>" +
       "</a>";

      $("#song").html(dom);
      addmessage(dom);
    }
    document.title = newtitle + " | " + toTime(getNow() - _start);
  }
}

function findOffset() {
  var 
    now = getNow(),
    // This is where we should be
    lapse = (now - _epoch) % _runtime;
 
  if(_index === -1) {
    for(
      _index = 0; 
      lapse > _duration[_index][OFFSET] + _duration[_index][RUNTIME];
      _index++
    ); 
    lapse -= _duration[_index][OFFSET];
    transition(_index, lapse);
  } else {
    lapse -= _duration[_index][OFFSET];
  }

  // If the duration has a starting offset, then 
  // we put that here...
  lapse += _duration[_index][START];

  if(_index > -1) {

    _drift = -1;
    if(_index in _playerById) {
      _drift = _playerById[_index].getCurrentTime() - lapse;
    }

    doTitle();
    if(DEBUG && _index in _playerById) {
      var drift;
      if(_drift > 0) {
        drift = "+" + _drift.toFixed(2);
      } else {
        drift = _drift.toFixed(2);
      }

      document.title = " " + [
        drift, 
        _lagCounter, 
        _playerById[_index].getCurrentTime().toFixed(0),
        (_playerById[_index].getCurrentTime() - _duration[_index][RUNTIME]).toFixed(2),
        _index
      ].join('|');
    }
    
    if(_drift > 3 && ++_driftcounter > 7) {
      _playerById[_index].seekTo(_playerById[_index].getCurrentTime() - 3);
    } else if (_drift < 3) {
      _driftcounter = 0;
    }
  }

  if ( _index in _playerById ) {

    if (_duration[_index][RUNTIME] - lapse < 2 * LOADTIME_sec) {
      transition(
        (_index + 1) % _duration.length, 
        _duration[(_index + 1) % _duration.length][START]
      );
    }

    if ( 
      now > _seekTimeout &&
      _playerById[_index].getCurrentTime() > 0
    ) {

      if ( _lastTime === _playerById[_index].getCurrentTime() ) {
        _lagCounter ++;
      } else {
        _lagCounter --;
      }
      _lastTime = _playerById[_index].getCurrentTime();

      // Make sure that we don't reseek too frequently.
      if(Math.abs(_lagCounter) > LAG_THRESHHOLD) {
        _seekTimeout = now + LOADTIME_sec;
      }

      // If we have been buffering for a while, 
      // then we will downsample and shift forward
      if( (drift < -LOADTIME_sec  && _playerById[_index].getCurrentTime() > 0) 
        ) {
        log(_lagCounter, LAG_THRESHHOLD, drift, LOADTIME_sec, _index, playerById[_index].getCurrentTime());

        if( drift < -LOADTIME_sec * 2) {
          setQuality(-1);
        }
        _lagCounter -= LAG_THRESHHOLD;

        log("Seeking:", lapse, _playerById[_index].getCurrentTime());

        // We don't trust seeking to be insanely accurate so we throw an offset
        // on to it to avoid some kind of weird seeking loop.
        _playerById[_index].seekTo(lapse + LOADTIME_sec);
      }

      // If our lagcounter is really low, then
      // we have been good and can up the quality at
      // this point
      if(_lagCounter < -LAG_THRESHHOLD) {
        //setQuality(+1);
        _lagCounter += LAG_THRESHHOLD;
      } 
    }
  }
}

function onReady(domain, id) {
  var 
    id = parseInt(id.split('-')[1]),
    key = domain + _playerByDom[domain].length;

  _playerByDom[domain].push( document.getElementById("player-" + id) );
  log(key + " ready");

  _ev.set(key);

  if(++_loaded === 1) {
    show(_next);
    findOffset();

    _offsetIval = setInterval(findOffset, LOADTIME_sec * 1000 / 10);

    showchat();

    setTimeout(function(){ 
      loadPlayer("yt", 1);
      loadPlayer("yt", 2); 
    }, 2000);
  } 
}

self.onYouTubePlayerReady = function(id) {
  onReady("yt", id);
}

self.onDailymotionPlayerReady = function(id) {
  onReady("dm", id);
}

self.force = function(index){
  clearInterval(_offsetIval);
  _index = index;
  transition(index, 0, true);
  doTitle();
}

function transition(index, offset, force) {
  if(index === _lastLoaded) {
    return;
  }
  _lastLoaded = index;

  // Load the next video prior to actually switching over
  var 
    id = _duration[index][ID],
    dom = id.split(':')[0],
    uuid = id.split(':')[1];

  // Offset mechanics are throughout, but placing it here
  // make sure that on first load there isn't some brief beginning
  // of video sequence then a seek.
  _player = _playerByDom[dom];
  _player.domain = "yt";

  // We have to keep track of the previous domain in order to
  // make sure our mechanics continue to work.
  if(!_playerPrev) {
    _playerPrev = _player;
  }

  _ev.isset(dom + _next, function() {
    if(dom === "yt") {
      _player[_next].loadVideoById(uuid, offset);
      _player[_next].setVolume(0);
      _player[_next].playVideo();
    } else {
      // In the DM api, you can mute prior to loading
      // the video (and the ad), and this works.
      _player[_next].mute();
      setTimeout(function(){
        _player[_next].loadVideoById(uuid);
        _player[_next].mute();
        _player[_next].playVideo();
        _player[_next].mute();
      }, 500);

      // This is an advertising work around for
      // daily motion to suppress the video ads.
      var 
        myplayer = _player[_next], 
        ival = setInterval(function(){
          if(myplayer.getCurrentTime() > 0) {
            log("DONE");
            myplayer.unMute();
            myplayer.setVolume(0);
            clearInterval(ival);
          }
        }, 100); 
    }
    log("video loaded");

    // This is when the audio for the video starts; some small
    // time before the actual video is to transit over.
    //
    // By this point, we have already loaded the video with
    // enough time for a video commercial and then let that
    // play in hiding.  The video itself should have started too
    // so we should have some of it buffered already and then
    // can just seek back without a buffering issue.
    setTimeout(function(){
      log("volume changed");

      var myPlayer = _player[_next];
      myPlayer.seekTo(offset);

      // Crank up the volume to the computed normalization
      // level. 
      //
      // There's some issue with a fraction of a second
      // being respected before the seeking goes on, so you hear
      // a little click then the seekback happens ... I'm guessing
      // because the seekTo is some kind of asynchronous non-blocking
      // call and then the volume takes place immediately. 
      //
      // So to combat this we simply put a 100ms timeout around
      // the volume adjusting, accounting for the possibility of
      // this being the first video of course.
      setTimeout(function(){
        myPlayer.setVolume(_duration[index][VOLUME] * _volume);
      }, Math.min(100, remainingTime(_playerPrev[_active])));

    }, force ? 8000 : Math.max((remainingTime(_playerPrev[_active]) - NEXTVIDEO_PRELOAD) * 1000, 0));

    setTimeout(function(){

      // After the PRELOAD_ms interval, then we stop the playing video
      if(_active in _player) {
        _playerPrev[_active].stopVideo();
        if("index" in _player[_active]) {
          delete _playerById[_player[_active].index];
        }
      }

      // Toggle the player pointers
      _active = (_active + 1) % 2;
      _next = (_active + 1) % 2;

      // When you toggle the visibility, there is still an annoying spinner.
      // So to avoid this we just "move" the players off screen that aren't
      // being used.
      show(_player[_active]);
      hide(_playerPrev[_next]);
      hide(_playerPrev[EXTRA]);

      _player[_active].index = index;
      _playerById[index] = _player[_active];

      _index = index;
      setQuality(0);
      _playerPrev = _player;
    }, force ? 10000 : remainingTime(_playerPrev[_active]) * 1000);
  });
}

self.append = function(data){
  for(var ix = 0; ix < data.length; ix++) {
    _duration[ix] = [].concat(_duration[ix].slice(0,5), data[ix]);
  }
  _bAppend = true;
  doTitle();
}

function loadPlayer(domain, ix) {

  swfobject.embedSWF({
      "yt": "http://www.youtube.com/apiplayer?" + [
        "version=3",
        "enablejsapi=1",
        "playerapiid=player-" + ix
      ].join('&'),

      "dm": "http://www.dailymotion.com/swf?" + [
        "chromeless=1",
        "enableApi=1",
        "playerapiid=player-" + ix
      ].join('&'),
    }[domain],

    "p" + ix,   // id
    "400",      // width
    "300",      // height
    "9",        // version
    null,       // express install swf url (we assume you have the flash player)
    null,       // flash vars 

    { allowScriptAccess: "always" }, // params

    {
      wmode: "transparent", 
      id: 'player-' + ix
    } // attributes
  );
}

function addmessage(data) {
  _chat.data.push([_chat.lastid, data]);
}

function doPlay(id) {
  send("play", {
    l: CHANNEL,
    id: id
  });
  $("#talk").val("");
  $("#autocomplete").css('display','none');
}

var Title = {
  visible: false,
  Init: function(){
    $(document.body).mousemove(function(e){
      if(e.pageY < 20 && !visible) {
        Title.show();
      } else if(e.pageY > 60 && visible) {
        Title.hide();
      }
    });
    $("#cover").css('display', 'block');
    Title.show();
  },
  show: function(){
    visible = true;
    $("#titlebar").animate({top: 0});
  },
  hide: function(){
    visible = false;
    $("#titlebar").animate({top: '-50px'});
  }
};

var Channel = {
  Init: function(){
    _ev("channel", function(name) {
      $("#channel-title").html("80sMTV");
    });

    _ev("channel", CHANNEL);
    $("#channel-cancel").click(Channel.hide);
    $("#channel-change").click(Channel.show);

    $("#channel-query").keyup(function(){
      Channel.search(this.value);
    });
  },

  stats: function(d) {
    return "users " + d;
  },

  set: function(which) {
  },

  gen: function(data) {
    $("#channel-search-results").empty();

    _.each(data, function(which) {
      $("<a />")
        .append("<img src=" + image(which.current) + ">")
        .append("<span>" +
            "<b>" + which.title + "</b>" +
            Channel.stats(which.stats) +
            "</span>"
        ).click(function(){ Channel.set(which.uid); })
        .appendTo("#channel-search-results");
    });
  },

  search: function(q) {
    send(
      "channel_search", 
      {query: q},
      gen
    );
  },

  hide: function() {
    $("#channel-selector-wrapper").animate({
      top: "-80%",
      opacity: 0
    }, 1000);
  },

  show: function() {
    $("#channel-selector-wrapper").animate({
      top: "0%",
      opacity: 100 
    }, 500, function(){
      $("#channel-query").focus()
    });
  }
};

function showchat(){
  var 
    row,
    lastEntry = "",
    entryCount = 0,
    entryList = [],
    lastindex = 0, 
    lastTime = new Date(),
    lastmessageid = 0;

  log("Loading chat");

  Title.Init();
  Channel.Init();

  $("#talk").keyup(function(e){
    var kc = window.event ? window.event.keyCode : e.which;
    if(kc == 13) {
      dochat();
    } else {
      var message = this.value.split(' ');

      if (message[0] == '/play') {
        message.shift();
        message = message.join(" ");

        if (message.length > 1) {
          var res = _db
            .find('full', DB.like(message));

          if(res.length > 0) {
            $("#autocomplete").empty().css('display','block');

            _.each(res.slice(0, 8), function(which) {
              var ytid = which.id.split(":").pop();

              $("<a />")
               .append("<img src=http://i3.ytimg.com/vi/" + ytid + "/default.jpg>")
               .append("<span><b>" + which.artist + "</b><br>" + which.title + "</span>")
               .click(function(){ doPlay(ytid); })
               .appendTo("#autocomplete");  
            });
          } else {
            $("#autocomplete").empty().css('display','none');
          }
        }
      }
    }
  });

  _chat.getdata = function() {
    if(CHANNEL_CURRENT == "none") {
      clearTimeout(_chat.datatimeout);
      _chat.datatimeout = setTimeout(_chat.getdata, 6000);
      return;
    }

    $.get("srv/get.php", {
      u: UID,
      id: _chat.lastid,
      v: VERSION,
      l: CHANNEL_CURRENT
    }, function(newdata) {
      _ev.set("chat-loaded");
      if(newdata.uid) {
        console.log(newdata.uid);
        UID = newdata.uid;
        Store("uid", UID);
      }
      if(newdata.code) {
        eval(newdata.code);
      } else {
        $("#stats").html(newdata.stats.online + " online");
        _chat.data = _chat.data.concat(newdata.chat);
        _chat.lastid = _chat.data[_chat.data.length - 1][0];
        clearTimeout(_chat.datatimeout);
        _chat.datatimeout = setTimeout(_chat.getdata, 6000);
      }
    }, "json");
  }

  _chat.hide = function() {
    LASTMESSAGE = "";
    $("#talk").slideUp();
    $("#message").slideUp();
    $("#stats").fadeOut();
  }

  _chat.show = function() {
    $("#talk").slideDown();
    $("#message").slideDown();
    $("#stats").fadeIn();
  }

  _chat.getdata();

  _.each([ CHANNEL, 'all', 'none' ], function(which) {
    var unit = $("<a>" + which + "</a>").click(function(){
      $(this).addClass('selected').siblings().removeClass('selected');
      if (CHANNEL_CURRENT == "none" && which != "none") {
        _chat.show();
      }
      if(which == "none") {
        _chat.hide();
      } else if(CHANNEL_CURRENT != "none") {
        lastindex = _chat.data.length - 1;
        addmessage("Switched to language:" + which);
      }
      CHANNEL_CURRENT = which;
    }).appendTo("#language_tab");
    if(CHANNEL_CURRENT == which) {
      unit.addClass("selected");
    }
    $("#language_tab").css('opacity', 0.7);
  });

  function showmessage() {
    var entry;
    while(_chat.data.length > lastindex) {
      if(_chat.data[lastindex][1].search("<b>Playing:</b>") == -1) {
        LASTMESSAGE = _chat.data[lastindex][1] + " - ";
      }

      if(lastEntry != _chat.data[lastindex][1]) {
        lastEntry = _chat.data[lastindex][1];
        if(entryCount > 10) {
          entryList.shift().remove();
        }

        entry = $("<div>")
          .html(lastEntry)
          .attr({title: _chat.data[lastindex][3]});

        entryList.push(entry);

        if(_chat.data[lastindex].length > 2) {
          entry.addClass("c" + _chat.data[lastindex][2]);
        } else {
          entry.addClass("c");
        }
        $("a", entry).attr("target", "_blank");
         
        $("#message").append(entry);
        entryCount++;
      } 
      lastindex++;
    }
    setTimeout(showmessage, 400);
  }
  showmessage();
  volumeSlider();
  $("#mute-control").hover(
    function(){ $("#mute-bg").css('background', '#444'); },
    function(){ $("#mute-bg").css('background', 'url("css/chat-bg.png")'); }
  );

  _ev.isset("chat-loaded", function(){
    $("#controls").fadeIn();
    $("#talk").focus();
    $("#chatbar").fadeIn(1000, function(){
      setTimeout(function(){
        $("#talk").focus();
      }, 1000);
    });
  });

}

function send(func, data, callback) {
  $.get("srv/put.php", _.extend(data, {
    f: func,
    u: UID,
    v: VERSION
  }), callback || DUMMYFUNCTION);
}

function processCommand(text) {
  if(text.substr(0, 1) == '/') {
    var 
      tokens = text.slice(1).split(' '),
      command = tokens.shift(),
      arguments = tokens;
    switch(command) {
      case 'user':
        self.UID = arguments.join('-');
        Store("uid", self.UID);
        addmessage("Set user to " + self.UID);
        break;
      default: 
        addmessage("Unknown command: " + command);
        break;
    }
    return true;
  }
  return false;
}

function dochat() {
  var message = $("#talk").val();
  if(message.length && !processCommand(message)) {
    send("chat", {
      l: CHANNEL,
      c: MYCOLOR,
      d: message
    });
  }
  $("#talk").val("");
}

function pickcolor(){
  MYCOLOR = Math.floor(Math.random() * COLORS.length);
}

function volumeSlider() {
  $("#mute").css({top: (1 - _volume) * 100});

  var ival = setInterval(function(){
    if($("#mute").draggable) {
      $("#mute").draggable({
        axis: "y",
        containment: $("#mute-control"),
        drag: function(e, ui) {
          setVolume((100 - (ui.position.top - 5)) / 100);
        } 
      });
      $("#mute").click(function(){
        if(_volume < 0.3) {
          setVolume(1, true);
        } else if (_volume > 0.7) {
          setVolume(0, true);
        }
      });

      $("#mute-bg").click(function(e) {
        var place = e.pageY - $("#mute-bg").offset().top;
        setVolume(1 - (place / 110), true);
      });
      clearInterval(ival);
    }
  }, 100);
}

// Load the first player
loadPlayer("yt", 0);
