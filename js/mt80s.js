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

if(!self.console) {
  self.console = {log:function(){}};
}

var
  CHANNEL = 1/*(document.location.search.length > 0) ? 
     document.location.search.substr(1)
   : (navigator.language ? 
        navigator.language
      : this.clientInformation.browserLanguage).split('-')[0])*/,

  CHANNEL_CURRENT = CHANNEL,

  MYCOLOR = Math.floor(Math.random() * 10),

  // This is the duration of the video minus the offsets in
  // the start and stop, as determined through visual inspection.
  // These are the transitions put on by different uploaders, things
  // like "THIS IS A JJ COOLGUY RIP" etc.
  ID = 0,

  RUNTIME = 1,
  START = 2,
  STOP = 3,

  // This is for volume normalization on a per video
  // basis
  VOLUME = 4,

  ARTIST = 5,

  TITLE = 6,

  NOTES = 7,

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

  LASTTITLE = "",

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium"];//, "large"]; //, "hd720", "hd1080", "highres"];

// }} // Constants

self.indexOf = function(array, item) {
  for(var ix = 0; ix < array.length; ix++) {
    if(array[ix] == item) {
      return ix;
    }
  }
  return -1;
}

// Utils {{
function getNow(offset) {
  return +(new Date() / 1000) + (offset || 0);
}

function onEnter(node, cb) {
  $(node).keyup(function(e){
    var kc = window.event ? window.event.keyCode : e.which;
    if(kc == 13) {
      cb();
    } 
  });
}

function remainingTime(player) {
  if(player) {
    return Math.max(0,
      player.getDuration() - 
      _song[STOP] - 
      player.getCurrentTime()
    );
  } else {
    return 0;
  }
}

function image(id) {
  return "http://i3.ytimg.com/vi/" + id.split(":").pop() + "/default.jpg>";
}

function secondsToTime(count) {
  var stack = [];

  stack.push((Math.floor(count) % 60) + " sec");

  // seconds
  count = Math.floor(count / 60);

  // minutes
  if (count > 1) {
    stack.push((count % 60) + " min");
    count = Math.floor(count / 60);
  }

  // hours
  if (count > 1) {
    stack.push((count % 24) + " hours");
    count = Math.floor(count / 24);
  }

  // days
  if (count > 1) {
    stack.push(count.toFixed(0) + " days");
  }
  return stack.reverse().join(' ').replace(/^0/,'');
}

function hide(player) {
  if(player && player.style) {
    player.style.left = "-2000%";
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
    lastentry: false,
    lastauthor: false,
    lastcolor: -1,
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
  
  // The lag counter is a token system that gets set by an interval.  If
  // we accumulate a certain negative or positive balance, then we can exchange
  // the negative or positive units for a quality shift. This makes sure that 
  // we can prove the stability of any setting through successive incremental
  // sampling
  _lagCounter = 0,

  _volume = Store("volume") || 1,

  _ev = EvDa(),

  _index = -1,

  _socket = false,

  _seekTimeout = 0,
  _qualityTimeout = 0,

  _driftcounter = 0,
  _drift,
  _counter = parseInt(Store("ttl") || 0),
 
  // The epoch time is based off the system time AND the users
  // local clock.  This makes sure that separate clock drifts
  // are *about* the same ... minus the TTL latency incurred by
  // the emit from the server of course (which we assume to be fairly
  // constant).
  _start = getNow(),
  _referenceTime = _start,
  _epoch = 1325778000 + ( _start - _referenceTime ),

  _offsetIval,

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],
  _playerPrev, 
  _playerByDom = {yt:[], dm:[]},
  _playerById = {},

  _lastTime = 0,

  _song,
  _next = 0,
  _runtime = 0;

// }} // Globals

if(!self.localStorage) {
  self.localStorage = {};
}
function Store(key, value) {
  if(arguments.length == 2) {
    localStorage[key] = value;
  }
  return localStorage[key];
}

function setVolume(amount, animate) {
  _volume = Math.max(0, amount);

  Store("volume", _volume);

  var volume = 100;

  if ("index" in _player[_active]) {
    volume = _song[VOLUME] * _volume;
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
      _playerById[_index].setVolume(_song[VOLUME] * _volume);
     
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

function onYouTubePlayerReady(id) { onReady("yt", id); }
function onDailymotionPlayerReady (id) { onReady("dm", id); }

// This sets the quality of the video along with
// supporting going down or up a notch based on
// what is detected, probably in findOffset
function setQuality(direction) {
  console.log(_playerById);
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
  if(_song[NOTES].search("240p") > 0) {
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
      _song[STOP] - 
      _playerById[_index].getCurrentTime() > LOADTIME_sec * 2.5
    ) {

      // First, load the active video in the extra player,
      // setting the volume to 0
      _player[EXTRA].loadVideoById(
        _song[ID].split(":")[1], 
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
            _player[EXTRA].setVolume(_song[VOLUME] * _volume);
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

function status(message){
  document.getElementById("loader-status").innerHTML = message;
}

var _unit = 15 * 60,
    _goal = _unit;

function doTitle(){
  var newtitle = _song[ARTIST] + " - " + _song[TITLE];
  if(LASTTITLE != newtitle) {
    LASTTITLE = newtitle;
    $("#video-current").html("<b>" + _song[ARTIST] + "</b>" +  _song[TITLE]);
  }
  var ttl = _counter + (getNow() - _start);
  Store("ttl", ttl);
  if(ttl > _goal) {
    addmessage("Total Time On Site " + secondsToTime(ttl));
    _goal = (1 + Math.floor(ttl / _unit)) * _unit;
  }
  document.title = newtitle + " | " + secondsToTime(ttl);
}

function onReady(domain, id) {
  var 
    id = parseInt(id.split('-')[1]),
    key = domain + _playerByDom[domain].length;

  _playerByDom[domain].push( document.getElementById("player-" + id) );
  log(key + " ready");

  _ev.set(key);

  if(++_loaded === 1) {
    status("Video Player Loaded...");
    show(_next);
   // findOffset();

   // _offsetIval = setInterval(findOffset, LOADTIME_sec * 1000 / 10);

    setInterval(doTitle, 1000);
    $("#loader").hide().remove();

    setTimeout(function(){ 
      loadPlayer("yt", 1);
      loadPlayer("yt", 2); 
    }, 2000);
  } 
}


function transition(song) {

  // Load the next video prior to actually switching over
  var 
    id = song[ID],
    offset = song[START],
    index = id,
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

    var 
      step1Timeout = Math.min(8000, (remainingTime(_playerPrev[_active]) - NEXTVIDEO_PRELOAD) * 1000),
      step2Timeout = step1Timeout + 2000;

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
        myPlayer.setVolume(song[VOLUME] * _volume);
      }, Math.min(100, remainingTime(_playerPrev[_active])));

      doTitle();

    }, step1Timeout);

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
      _playerById[index].setPlaybackQuality("medium");

      _index = index;
      setQuality(0);
      _playerPrev = _player;
    }, step2Timeout);
  });
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

    { id: 'player-' + ix } // attributes
  );
}

function addmessage(data) {
  _chat.data.push([_chat.lastid, "<p class=announce>" + data + "</p>"]);
  showmessage();
}

function verb(command, id) {
  send("channel", {
    action: command,
    params: {
      channel: 1,
      ytid: id
    }
  });
  $("#talk").val("");
  $("#autocomplete").css('display','none');
}

var User = {
  loggedin: false,
  Init: function(){
    _ev.on("panel:user", function(which) {
      if(which == "show") {
        $("#login-button").fadeOut();
      } else {
        $("#login-button").fadeIn();
      }
    });
    $("#login-button").click(function(){
      if(User.loggedin) {
        User.logout();
      } else {
        Panel.show("user");
        $("#input-username").focus();
      }
    });
    $("#user-cancel").click(function(){
      Panel.hide("user");
      $("#talk").focus();
    });
    onEnter("#input-username", User.setuser);
    $("#user-login").click(User.setuser);
  },
  setuser: function() {
    var username = $("#input-username").val();
    if(username.length > 0) {
      send("set-user", {user: username});
      Panel.hide("user");
      $("#talk").focus();
    }
  },
  login: function(who){
    $("#user-control").css('visibility', 'visible');
    if(!who) {
      if(User.loggedin) {
        User.logout();
      }
    } else {
      User.loggedin = true;
      $("#display-username").html("You are " + who + ".");
      $("#login-button").html("Log out");
    }
  },
  logout: function(){
    User.loggedin = false;
    $("#login-button").html("Log in");
    $("#display-username").html("You are anonymous.");
    send("set-user", {user: false});
  }
};
var Song = {
  Init: function(){
    $("#video-current-wrapper").click(function(){
      Panel.toggle("song");
    });

    $("#song-show-history").click(function(){
      _socket.emit("get-history");
    });

    $("#song-delist").click(function(){
      Song.countdown();
      Panel.hide("song");
      _socket.emit("delist", {
        vid: _song[ID],
        title: _song[TITLE],
        artist: _song[ARTIST]
      });
    });

    onEnter("#input-song-search", Song.search);
    _ev.on("panel:song", function(which) {
      if(which == "show") {
        $("#input-song-search").focus();
        _socket.emit("get-history");
      } else {
        $("#input-song-search").val("");
        $("#song-search-results").empty();
        $("#song-search-label").html("");
      }
    });
  },

  countdown: function(){
    $("#countdown").css('display','inline-block').html("9");
    var 
      count = 9,
      ival = setInterval(function(){
        count--;
        $("#countdown").html(count);
        if(count == 0) {
          $("#countdown")
            .html("")
            .css('display','none');
          clearInterval(ival);
        }
      }, 1000); 
  },

  format: function(data, type) {
    var 
      id = data.vid.split(':').pop(),
      node;
    
    node = $("<a class=title />").append("<img src=http://i3.ytimg.com/vi/" + id + "/default.jpg>")

    if(type == "history") {
      node.attr({
        target: "_blank",
        href: "http://youtube.com/watch?v=" + id
      }).click(function(){
        var oldvolume = _volume;
        setVolume(0, true);
        $(document.body).bind('mousemove', function(){
          $(document.body).unbind('mousemove');
          setVolume(oldvolume, true);
        });
      });
    } else {
      node.click(function(){ 
        var 
          iter = 5,
          ival = setInterval(function(){
            if(iter == 0) {
              Panel.hide("song");
              clearInterval(ival);
              Song.countdown();
            }
            if(iter % 2) {
              node.css("background", "#888");
            } else {
              node.css("background", "#000");
            }
            iter--;
          }, 150);
          _socket.emit("video-play", data); 
      });
    }

    if(data.artist) {
      node.append("<span><b>" + data.artist + "</b>" + data.title + "</span>");
    } else {
      node.append("<span>" + data.title + "</span>")
    }
    return node;
  },

  reallyDelist: function(q,el) {
    _socket.emit("really-delist", { vid: q });
    addmessage("Delisted");
    $(el.parentNode).slideUp();
  },

  search: function(q){
    var qstr = q || $("#input-song-search").val();

    if(qstr && qstr.length) {
      $("#song-search-results").empty();
      $("#song-search-label").html("Searching...");
      _socket.emit("search", qstr);
    }
  },

  gen: function(data) {
    var type;
    $("#song-search-results").empty();
    if(data.query) {
      type = 'search';
      if(data.results.length) {
        $("#song-search-label").html("Showing results for <b>" + data.query + "</b>");
      } else {
        $("#song-search-label").html("Nothing found for <b>" + data.query + "</b> :-(");
      }
    } else {
      type = 'history';
      $("#song-search-label").html("Last played videos on " + data.channel + "</b>");
    }

    _.each(data.results, function(row) {
      Song.format(row, type).appendTo("#song-search-results");
    });
  }
};

var Channel = {
  Init: function(){
    _ev("channel", function(name) {
      $("#channel-title").html(name);
    });

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
      {query: q}
    );
  },

  hide: function() {
    $("#channel").animate({width: 0}, function(){
      $(this).hide();
    });
  },

  show: function() {
    $("#channel").show().animate({width: "200px"});
  }
};

var Panel = {
  visible: {count:0},
  toggle: function(which) {
    if(Panel.visible[which]) {
      Panel.hide(which);
    } else {
      Panel.show(which);
    }
  },
  show: function(which) {
    if(Panel.visible[which]) {
      return;
    }
    _ev.set("panel:" + which, "show");
    Panel.visible[which] = true;
    Panel.visible.count++;
    if(Panel.visible.count == 1) {
      $("#lhs-expand").hide();
    }
    $("#" + which).show().animate({
      opacity: 1,
      width: "220px"
    });

    $("#panels").animate({width: (Panel.visible.count * 224) + "px"});
    $("#players").animate({marginLeft: (Panel.visible.count * 224) + "px"});
  },
  hide: function(which) {
    if(!Panel.visible[which]) {
      return;
    }
    _ev.set("panel:" + which, "hide");
    Panel.visible[which] = false;
    Panel.visible.count--;
    $("#" + which).animate({
      opacity: 0,
      width: 0
    }, function(){
      $(this).hide();
      if(Panel.visible.count == 0) {
        $("#lhs-expand").show();
      } 
    });

    var width = Math.max(20, Panel.visible.count * 224);
    $("#panels").animate({width: width + "px"});
    $("#players").animate({marginLeft: width + "px"});
  }
};

function when(prop, cb) {
  var ival = setInterval(function(){
    if(self[prop]) {
      cb();
      clearInterval(ival);
    }
  }, 25);
}

function showchat(){
  var 
    row,
    lastEntry = "",
    entryCount = 0,
    entryList = [],
    lastindex = 0, 
    lastTime = new Date(),
    lastmessageid = 0;

  _socket = io.connect('http://' + window.location.hostname + ':1985/');

  log("Loading chat");

  _socket.on("stats", function(d) {
    $("#channel-stats").html(d.online + " online");
  });

  _socket.on("search-results", Song.gen);

  _socket.on("code", eval);

  _socket.on("song", function(d) {
    _song = d;
    transition(d);
  });

  _socket.on("uid", function(d) { Store("uid", d); });
  _socket.on("channel-name", function(d){ _ev("channel", d); });
  _socket.on("username", User.login);

  send("greet-response", {
    color: MYCOLOR,
    uid: Store("uid"),
    lastid: _chat.lastid,
    channel: CHANNEL_CURRENT
  });

  _socket.on("greet-request", function(version) {
    send("greet-response", {
      color: MYCOLOR,
      uid: Store("uid"),
      lastid: _chat.lastid,
      channel: CHANNEL_CURRENT
    });
  });

  _socket.on("chat", function(d) {
    _chat.data = _chat.data.concat(d);
    _chat.lastid = _chat.data[_chat.data.length - 1][0];
    showmessage();
  });

  self.showmessage = function() {
    var entry, color;

    while(_chat.data.length > lastindex) {

      lastEntry = _chat.data[lastindex][1];
      if(entryList.length > 20) {
        entryList.shift().remove();
      }

      if(_chat.data[lastindex].length > 2) {
        color = _chat.data[lastindex][2];
      }

      if(
          (_chat.data[lastindex][3] != _chat.lastauthor) || 
          (_chat.lastauthor == false) ||
          (_chat.lastcolor == -1 ) ||
          (_chat.lastcolor !== color)
        ) {
        entry = $("<div>").html(lastEntry);

        _chat.lastauthor = _chat.data[lastindex][3];

        entryList.push(entry);

        if(_chat.data[lastindex].length > 2) {
          entry.addClass("c" + _chat.data[lastindex][2]);
        } else {
          entry.addClass("c");
        }
        _chat.lastcolor = color;

        $("#message").prepend(entry);
        if(_chat.lastauthor) {
          entry.append("<div class=author>~ " + _chat.lastauthor + ".</div>");
        } 
        _chat.lastentry = entry;
      } else {
        $(lastEntry).insertAfter(_chat.lastentry.get(0).lastChild.previousSibling);
      }
      $("a", entry).attr("target", "_blank");
       
      entryCount++;
      lastindex++;
    }
  }
}

function send(func, data, callback) {
  _socket.emit(func, data);
}

function processCommand(text) {
  if(text.substr(0, 1) == '/') {
    var 
      tokens = text.slice(1).split(' '),
      command = tokens.shift(),
      arguments = tokens;
    switch(command) {
      case 'user':
        var user = arguments.join('-');
        send("set-user", {user: user});
        addmessage("Set user to " + user);
        break;

      case 'channel':
        send("channel", {
          action: arguments.shift(),
          params: arguments.shift()
        });
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
      chan: CHANNEL,
      d: message
    });
  }
  $("#talk").val("");
}

function volumeSlider() {
  $("#mute").css({top: (1 - _volume) * 100});

  var ival = setInterval(function(){
    if($("#mute").draggable) {
      $("#mute").draggable({
        axis: "y",
        containment: $("#mute-control"),
        drag: function(e, ui) {
          setVolume(1 - ui.position.top / 100);
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

status("Code Loaded...");
// Load the first player
loadPlayer("yt", 0);

when("io", function(){
  status("Server Contacted");
  showchat();
});

when("$", function (){
  Panel.show("chat");
  $(".btn.collapse").click(function(){
    Panel.hide(this.parentNode.id);
  });

  $("#lhs-expand").click(function(){
    Panel.show("chat");
  });

  $("#channel-expand").click(function(){
    Panel.toggle("channel");
  });
  _ev.on("panel:channel", function(which) {
    if(which == "show") {
     // $("#channel-expand").fadeOut();
    } else {
     // $("#channel-expand").fadeIn();
    }
  });

  $("#song-expand").click(function(){
    Panel.show("song");
  });

  onEnter("#talk", dochat);

  Channel.Init();
  User.Init();
  Song.Init();
  showmessage();
  volumeSlider();
  $("#mute-control").hover(
    function(){ $("#mute-bg").css('background', '#333'); },
    function(){ $("#mute-bg").css('background', 'url("images/chat-bg.png")'); }
  );

  $("#talk").focus();
});
