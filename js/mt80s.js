var scripts = [
  [0, 'js/underscore-min.js'],
  [10, 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'],
  [2000, 'js/db.min.js']
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
if(!self.localStorage) {
  self.localStorage = {};
}

var
  MYCOLOR = Math.floor(Math.random() * 10),

  DUMMY = new Function(),
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

// Utils {{
function getNow(offset) {
  return +(new Date() / 1000) + (offset || 0);
}

function blink(node, cb) {
  var 
    iter = 5,
    ival = setInterval(function(){
      if(iter == 0) {
        node.css('background','none');
        if (cb) {
          cb(node);
        }
        clearInterval(ival);
      } else if(iter % 2) {
        node.css("background", "#888");
      } else {
        node.css("background", "#000");
      }
      iter--;
    }, 150);
}

function onEnter(node, cb) {
  $(node).keyup(function(e){
    var kc = window.event ? window.event.keyCode : e.which;
    if(kc == 13) {
      cb($(node).val());
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

function time(fmt, utime) {
	// return time in a format
	// fmt is of type
	// 	%[Y|M|N|D|W|H|h|m|s]
	// 		Y = year, such as 2010
	// 		N = Named month, such as Feb
	// 		M = month, such 2
	// 		W = Week day, such as Tue
	// 		D = Day, such as 24
	// 		H = hour base 12
	// 		h = hour
	// 		m = minute
	// 		s = second
  var d = new Date(utime),
      t = {
    Y: d.getFullYear(),
    N: C.months[d.getMonth()],
    M: (d.getMonth() + 1).padLeft(2),
    W: C.days[d.getDay()],
    D: d.getDate().padLeft(2),
    H: ( ((d.getHours() + 1) % 12) - 1),
    h: d.getHours().padLeft(2),
    m: d.getMinutes().padLeft(2),
    s: d.getSeconds().padLeft(2)
  }, post = '';

  if(!fmt) {
    fmt = "%Y-%M-%D %h:%m:%s";
  }

  return fmt.replace(/%(.)/g, function (f, m) {
    if(m == 'H') {
      post = [' AM', ' PM'][Math.floor(t.h / 12)];
    }

    return t[m];
  }) + post;
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

  // This the the current playback quality index, which can be triggered
  // in a direction (either up or down) based on how successful we can
  // combat drift (basically by playing without hitting a buffer interval)
  //
  // We start at medium quality and then the skies the limit, I guess.
  _currentLevel = 1,

  _unit = 15 * 60,
  _goal = _unit,

  _volume = Store("volume") || 1,

  _ev = EvDa(),

  _index = -1,

  _channel = document.location.hash.slice(1),
  _socket = false,

  _seekTimeout = 0,
  _qualityTimeout = 0,

  _driftcounter = 0,
  _drift,
  _counter = parseInt(Store("ttl") || 0),
 
  _start = getNow(),

  _letterBoxed = false,

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],
  _playerPrev, 
  _playerByDom = {yt:[], dm:[]},
  _playerById = {},

  _song,
  _next = 0,
  _runtime = 0;

// }} // Globals


function Store(key, value) {
  if(arguments.length == 2) {
    localStorage[key] = value;
  }
  return localStorage[key];
}


var Player = (function(){
  self.onYouTubePlayerReady = function(id) { onReady("yt", id); }
  self.onDailymotionPlayerReady = function(id) { onReady("dm", id); }

  function check(player) {
    return (player && player.style);
  }

  function hide(player, transition) {
    if(check(player)) {
      player.style.left = "-2000%";
    }
  }

  function show(player, transition) {
    if(check(player)) {
      player.style.left = 0;
    }
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

  function onReady(domain, id) {
    var 
      id = parseInt(id.split('-')[1]),
      key = domain + _playerByDom[domain].length;

    _playerByDom[domain].push( document.getElementById("player-" + id) );
    log(key + " ready");

    _ev.set(key);

    if(++_loaded === 1) {
      show(_next);

      setTimeout(function(){ 
        Player.load("yt", 1);
        Player.load("yt", 2); 
      }, 1000);

      when("_song", function(){
        setInterval(doTitle, 1000);
      });
    } 
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

    if(!direction) {
      direction = 0;
    }
    log("Quality Direction", direction);

    // If no video is loaded, then go no further.
    if(activeAvailable.length === 0) {
      log("No video loaded");
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
    
    if(!newQualityWord)  {
      log("No Quality hit");
    }

    log("Current Quality:", activeQualityWord);
    log("Quality to hit:", newQualityWord);

    // If this video doesn't support the destination quality level
    if ( _.indexOf(activeAvailable, newQualityWord) === -1) {
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
          _currentLevel = _.indexOf(LEVELS, newQualityWord);
        }
      } 
    }
  }
  return {
    load: function(domain, ix) {
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
    },

    letterbox: function() {
      _letterBoxed = true;
      $("#players").css({
        height: "162px",
        width: "216px",
        paddingTop: "6px",
        marginLeft: "6px" 
      });
      $("#top").css({
        marginTop: "160px"
      });
    },
    hide: hide,
    setQuality: setQuality,
    show: show,
    fullscreen: function(){
      if(_letterBoxed) {
        _letterBoxed = false;
        $("#players").css({
          height: "100%",
          width: "auto",
          paddingTop: 0
        });
        $("#top").css({
          marginTop: "0"
        });
      }
    }
  }
})();

function doTitle(){
  var newtitle = _song[ARTIST] + " - " + _song[TITLE];
  if(LASTTITLE != newtitle) {
    LASTTITLE = newtitle;
    $("#video-current").html("<b>" + _song[ARTIST] + "</b>" +  _song[TITLE]);
  }
  var ttl = _counter + (getNow() - _start);
  Store("ttl", ttl);
  if(ttl > _goal) {
    Chat.addmessage("Total Time On Site " + secondsToTime(ttl));
    _goal = (1 + Math.floor(ttl / _unit)) * _unit;
  }
  document.title = newtitle + " | " + secondsToTime(ttl);
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
      _player[_next].setPlaybackQuality("medium");
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
            myplayer.unMute();
            myplayer.setVolume(0);
            clearInterval(ival);
          }
        }, 100); 
    }
    log("video loaded");

    var 
      step1Timeout = Math.min(NEXTVIDEO_PRELOAD, (remainingTime(_playerPrev[_active]) - NEXTVIDEO_PRELOAD) * 1000),
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
      Player.show(_player[_active], 'slide');
      Player.hide(_playerPrev[_next], 'slide');
      Player.hide(_playerPrev[EXTRA]);

      _player[_active].index = index;
      _playerById[index] = _player[_active];

      _index = index;
      _playerPrev = _player;
      //_ev.isset("yt2", Player.setQuality);
    }, step2Timeout);
  });
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
    $("#register-button").click(function(){
      $("#email-wrap").slideDown();
    });
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
var Song = (function(){
  var 
    _editing = false,
    _lastSong = false,
    _db = {};

  self._DB = _db;

  function preview(obj) {
    _lastSong = obj;

    var 
      id = obj.vid.split(':').pop(),
      width = 500,
      height = width * 3 / 4;
    
    $("#embedder").html('<object width=' + width + ' height=' + height + '>' +
      '<param name="movie" value="http://www.youtube.com/v/' + id + '?version=3&amp;hl=en_GB&amp;autoplay=1"></param>' + 
      '<param name="allowscriptaccess" value="always"></param>' + 
      '<embed src="http://www.youtube.com/v/' + id + '?version=3&amp;hl=en_GB&amp;autoplay=1" type="application/x-shockwave-flash" width=' + width + ' height=' + height + ' allowscriptaccess="always"></embed>' +
      '</object>');
    $("#song-preview .bigbtn").show();

    $("#preview-artist").html(obj.artist);
    $("#preview-title").html(obj.title);
    //$("#title-edit").css('display','inline-block');
  }

  function panelFlash() {
    switch(_ev("song-tab")) {
      case 'Everything':
        if(!_db[_channel]) {
          _socket.emit("get-all-videos");
        } else {
          Song.search();
        }
        break;
      case 'History':
        _socket.emit("get-history");
        break;
    }
  }
  return {
    Init: function(){

      _socket.on("history", Song.gen);

      _socket.on("all-videos", function(res) {
        _db[res.channel] = DB().insert(
          DB.objectify([
           "id", 
           "length", 
           "start", 
           "volume", 
           "artist", 
           "title"
          ], res.data));
        Song.search();
      });

      $("#video-current-wrapper").click(function(){
        when("_", function(){
          Panel.toggle("song");
        });
      });

      $("#song-results").css({height: $(window).height() - 128});
      $(window).resize(function(){
        $("#song-results").css({height: $(window).height() - 128});
      });

      $("#song-show-history").click(function(){
        _socket.emit("get-history");
      });

      $("#song-cancel,#song-select-cancel").click(function(){
        Panel.hide("song");
      });

      $("#song-delist").click(function() {
        _socket.emit("delist", _lastSong);
        Panel.hide("song");
      });

      $("#song-select-next").click(function(){
        Panel.hide("song");
        _socket.emit("video-play", _lastSong); 
      });

      $("#song-select-now").click(function(){
        Panel.hide("song");
        _socket.emit("video-play-now", _lastSong); 
      });

      $("#song li").click(function(){
        var which = this.innerHTML;
        $(this).addClass('selected').siblings().removeClass('selected');
        _ev.set("song-tab", which);

      });

      _ev("song-tab", panelFlash);
      _ev("song-tab", "History");

      $("#song-skip").click(function(){
        Song.countdown();
        Panel.hide("song");
        _socket.emit("skip", {
          vid: _song[ID],
          title: _song[TITLE],
          artist: _song[ARTIST]
        });
      });

      onEnter("#input-song-search", Song.search);

      _ev.on("panel:song", function(which) {
        if(which == "show") {
          Song.reset();
          Player.letterbox();
          $("#song").css({
            display: 'inline-block',
            opacity: 1,
            width: "100%"});
          $("#input-song-search").focus();
          panelFlash();
        } else if(which == 'hide-after') {
          Song.reset();
          $("#song-preview .bigbtn").hide();
          console.log("UNMUTED");
          Volume.unmute();
          Player.fullscreen();
          $("#input-song-search").val("");
          $("#song-results").empty();
          $("#song-search-label").html("");
        }
      });

      var panel = 1;
      setInterval(function(){
        $("#song-results img").each(function() {
          var pieces = this.src.split('/');
          pieces.pop();
          pieces.push(panel + '.jpg');
          this.src = pieces.join('/');
        });
        panel ++;
        if(panel == 4) {
          panel = 1;
        }
      }, 2000);

      $("#title-edit").click(function(){

      });
    },

    countdown: function(){
      /*
      $("#countdown").css('display','inline-block').html(NEXTVIDEO_PRELOAD + 1);
      var 
        count = NEXTVIDEO_PRELOAD + 1,
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
        */
    },

    reset: function() {
      $("#embedder").empty();
      $("#preview-artist").html("Video Preview");
      $("#preview-title").empty();
    },

    format: function(data, type) {
      var 
        id = data.vid.split(':').pop(),
        node;
      
      node = $("<a class=title />").append("<img src=http://i3.ytimg.com/vi/" + id + "/1.jpg>")

      node.click(function(){ 
        preview(data);
        blink(node, Volume.mute);
      });

      if(data.artist) {
        node.append("<span><b>" + data.artist + "</b>" + data.title + "</span>");
      } else {
        node.append("<span>" + data.title + "</span>")
      }
      return node;
    },

    search: function(q){
      var 
        qstr = q || $("#input-song-search").val(),
        query = {};

      if(_ev("song-tab") == "Everything") {
        $("#song-results").empty();
        if(qstr && qstr.length) {
          $("#song-search-label").html("Search results for " + qstr);
          qstr = qstr.toLowerCase();

          // lambda search hotness.
          query = function(entry){
            return [
              entry.artist, 
              entry.title
            ].join(' ').toLowerCase().search(qstr) > -1;
          }
        } else {
          $("#song-search-label").html("Everything on " + _channel);
        }
        _db[_channel].find(query)
          .select(
            'artist',
            'title',
            'id'
          ).sort('artist').each(function(res){
            Song.format({
              artist:res[0],
              title:res[1],
              vid:res[2]
            }).appendTo("#song-results");
          });
      } else if(qstr && qstr.length) {
        $("#song-results").empty();
        $("#song-search-label").html("Searching...");
        _socket.emit("search", qstr);
      }
    },

    gen: function(data) {
      var 
        type,
        titles = {
          local: "Existing",
          remote: "New",
          history: ""
        };

      $("#song-results").empty();
      if(data.query) {
        type = 'search';
        if(data.results.total) {
          $("#song-search-label").html("Showing results for <b>" + data.query + "</b>");
        } else {
          $("#song-search-label").html("Nothing found for <b>" + data.query + "</b> :-(");
        }
      } else {
        type = 'history';
        $("#song-search-label").html("Last played videos on " + data.channel + "</b>");
      }

      _.each(_.keys(titles), function(which) {
        if(data.results[which] && data.results[which].length) {
          if(titles[which]) {
            $("<h3>" + titles[which] + "</h3>").appendTo("#song-results");
          }
          _.each(data.results[which], function(row) {
            Song.format(row, type).appendTo("#song-results");
          });
        }
      });
    }
  }
})();

var Channel = {
  Init: function(){
    _ev("channel", function(name) {
      $("#channel-title").html(name);
    });

    _ev("panel:channel", function(which){
      if(which == "show") {
        send("get-channels", {query: false});
      }
    });

    onEnter("#input-channel-search", Channel.search);

    $("#channel-query").keyup(function(){
      Channel.search(this.value);
    });
  },

  stats: function(d) {
    return "users " + d;
  },

  set: function(which) {
    _ev('app-state', 'channel');
    _channel = which;
    send("channel-join", {channel: which});
    document.location.hash = which;
    Chat.reset();
  },

  display: function(obj, cb) {
    return $("<div class=channel />").append(
      "<em>" + obj.name + "</em>" +
      "<small>" + (obj.count ? ( obj.count + " partying" ) : "Be the first") + "</small>"
    ).append(Song.format(obj)).click(cb);
  },

  gen: function(res) {
    if(_ev("app-state")== "splash") {
      return;
    }
    $("#channel-results").empty();

    _.each(res, function(which) {
      Channel.display(which, function(){
        blink($(this), function(){
          Panel.hide("channel");
        });
        Channel.set(which.name); 
        Song.countdown();
      }).appendTo("#channel-results")
    });
  },

  search: function(q) {
    send(
      "get-channels",
      {query: q}
    );
  }
};

var Chat = (function(){
  var 
    row,
    lastEntry, 
    entryList,
    lastindex = 0;

  function reset() {

    self._chat = {
      lastuid: undefined,
      data: [],
      lastid: 0
    };

    lastEntry = "";
    entryList = [],
    lastindex = 0;
    $("#message").empty();

    send("greet-response", {
      color: MYCOLOR,
      uid: Store("uid"),
      lastid: _chat.lastid,
      channel: _channel
    });
    _ev.set("greeted");
  }

  function Init(){
    _ev.on("panel:chat", function(which) {
      if(which == "hide") {
        Player.fullscreen();
      }
    });

    when("$", function(){
      var inputHeight = $("#user-control").height() + $("#talk").height();

      $("#message-wrap").css({height: $(window).height() - 140 - inputHeight});
      $(window).resize(function(){
        $("#message-wrap").css({height: $(window).height() - 140 - inputHeight});
      });
      // There's a race condition here ... so we run this twice.
      setTimeout(function(){
        $("#message-wrap").css({height: $(window).height() - 140 - inputHeight});
      }, 3000);

      log("Loading chat");
      $("#talk").focus();

      _socket.on("chat", function(d) {
        _chat.data = _chat.data.concat(d);
        _chat.lastid = _chat.data[_chat.data.length - 1]._id;
        showmessage();
      });

      if(!_channel) {
        reset();
      }

      _socket.on("greet-request", function(version) {
        send("greet-response", {
          color: MYCOLOR,
          uid: Store("uid"),
          lastid: _chat.lastid,
          channel: _channel
        });
      });
    });
  }

  function addmessage(data) {
    _chat.data.push({
      _id: _chat.lastid,
      type: 'announce',
      text: data
    });
    showmessage();
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
          Chat.addmessage("Set user to " + user);
          break;

        case 'channel':
          send("channel", {
            action: arguments.shift(),
            params: arguments.shift()
          });
          break;

        default: 
          Chat.addmessage("Unknown command: " + command);
          break;
      }
      return true;
    }
    return false;
  }

  var format = {
    announce: function(data) {
      return "<p class=announce>" + data.text + "</p>";
    },

    skip: function(data) {
      var id = data.id.split(':').pop();
      return "<div class=action>" +
        "<em>Skipped:</em>" +
           "<a class=title target=_blank href=http://youtube.com/watch?v=" + id + ">" + 
           "<img src=http://i3.ytimg.com/vi/" + id + "/default.jpg>" +
           "<span>" +
             "<b>" + data.artist + "</b>" +  
              data.title +
              "</span>" +
             "</a>" +
           "</div>";
    },
    delist: function(data) {
      var id = data.id.split(':').pop();
      return "<div class=action>" +
          "<em>Delisted:</em>" +
          "<a class=title target=_blank href=http://youtube.com/watch?v=" + id + ">" + 
           "<img src=http://i3.ytimg.com/vi/" + id + "/default.jpg>" +
           "<span>" +
             "<b>" + data.artist + "</b>" +  
             data.title +
           "</span>" +
         "</a>" +
       "</div>";
    },
    request: function(data) {
      var id = data.id.split(':').pop();
      return "<div class=action>" +
          "<em>Requested:</em>" +
          "<a class=title target=_blank href=http://youtube.com/watch?v=" + id + ">" + 
           "<img src=http://i3.ytimg.com/vi/" + id + "/default.jpg>" +
           "<span>" +
             "<b>" + data.artist + "</b>" +  
             data.title +
           "</span>" +
         "</a>" +
       "</div>";
    },
    chat: function(data) {
      return data.text
    }
  };
    
  function showContext(){
  }

  function showmessage() {
    var 
      entry, 
      row,
      color;

    while(_chat.data.length > lastindex) {

      row = _chat.data[lastindex];
      // Only display rows that we know how to
      // display.
      if(format[row.type]) {

        // Truncate the log after 20 containers
        // of messages.
        if(entryList.length > 20) {
          entryList.shift().remove();
        }

        entry = format[row.type](row);

        // If this is a new author or the first entry 
        // then we create a new entry
        if(!_chat.lastentry || ( _chat.lastuid != row.uid )) {
          entry = $("<div>").html(entry);

          // If it's a human, it will have a color
          if(row.color) {
            entry.addClass("c" + row.color);
          }

          if(row.who) {
            $("<div class=author>" + row.who + ".</div>").click(function(){
              if(entry.expanded) {
                return;
              } else {
                entry.expanded = true;
                showContext(row);
              }
            }).appendTo(entry);
          }

          entryList.push(entry);
          $("#message").append(entry);

          // This is needed if the author says further things
          // before someone else.
          _chat.lastentry = entry;
        } else {
          $(entry).insertAfter(_chat.lastentry.get(0).lastChild.previousSibling);
        }

        // A value of undefined here is a-ok.
        _chat.lastuid = row.uid;
      }
      
      $("a", entry).attr("target", "_blank");
       
      lastindex++;
    }
  }

  return {
    Init: Init,
    showmessage: showmessage,
    addmessage: addmessage,
    send: function(){
      var message = $("#talk").val();
      if(message.length && !processCommand(message)) {
        send("chat", { 
          d: message,
          vid: _song ? _song[ID] : 0,
          offset: _song ? _playerById[_song[ID]].getCurrentTime() : 0
        });
      }
      $("#talk").val("");
    },
    reset: reset
  };
})();


var Panel = {
  visible: {count:0},
  currentWidth: 0,
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
    var width = 220;
    if(which != "song") {
      Panel.hide("song");
    } else {
      _.each(["user", "channel"], function(which){
        Panel.hide(which, true);
      });
      width = 600;
    }

    _ev.set("panel:" + which, "show");
    Panel.visible[which] = true;
    Panel.visible.count++;
    if(Panel.visible.count == 1) {
      $("#lhs-expand").hide();
    }

    Panel.currentWidth += width;

    if(_letterBoxed) {
      $("#panels").css({width: Panel.currentWidth + "px"});
      $("#players").css({
        marginLeft: "6px"
      });
    } else {
      $("#panels").animate({width: Panel.currentWidth + "px"});
      $("#players").animate({marginLeft: Panel.currentWidth + "px"});
      $("#" + which).show().animate({
        opacity: 1,
        width: width + "px"
      });
    }
  },
  hide: function(which, now) {
   
    if(!Panel.visible[which]) {
      return;
    }

    var 
      func = now ? "css" : "animate",
      width = 220;

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

    if(which == 'song') {
      width = 600;
      func = "css";
    }
    Panel.currentWidth -= width;
    width = Math.max(20, Panel.currentWidth);
    $("#panels")[func]({width: width + "px"});
    $("#players")[func]({marginLeft: width + "px"});
    
    _ev.set("panel:" + which, "hide-after");
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

function send(func, data) {
  when("_socket", function(){
    console.log("emitting " + func);
    _socket.emit(func, data);
  });
}

var Volume = (function(){
  var 
    oldvolume,
    muted = false; 

  return {
    Init: function(){
      var 
        _mousedown = false,
        _expanded = false;
      
      function toggle(){
        if(_expanded) {
          $("#mute-control .expanded").hide();
        } else {
          Volume.set(_volume);
          $("#mute-control .expanded").show();
        }
        _expanded = !_expanded;
        return false;
      }
      $("#mute").click(toggle).mousedown(function(){
        return false;
      });

      $(document.body).mouseup(function(){
        _mousedown = false;
      });
      $(document.body).mousedown(function(){
        _expanded = true;
        toggle();
      });
      $("#mute-control .expanded").mousedown(function(e){
        _mousedown = true;
        var offset = 70;
        if(_letterBoxed) {
          offset += 160;
        }
        Volume.set(1 - (e.pageY - offset) / 100);
        return false;
      }).mousemove(function(e){
        var offset = 70;
        if(_letterBoxed) {
          offset += 160;
        }
        if(_mousedown) {
          Volume.set(1 - (e.pageY - offset) / 100);
        }
        return false;
      });
    },

    set: function(amount, nostore) {
      _volume = Math.max(0, amount);
      _volume = Math.min(1, _volume);

      if(!nostore) { 
        Store("volume", _volume);
      }

      var volume = 100;

      if(_player[_active]) {
        if (_player[_active].index) {
          volume = _song[VOLUME] * _volume;
        }
      }
      $("#mute-fg").css('height', (_volume * 100) + "px");

      if(_playerPrev && _playerPrev[_active]) {
        _playerPrev[_active].setVolume(volume * _volume);
      }
    },

    mute: function(){
      if(muted == false) {
        oldvolume = _volume;
        Volume.set(0, true);
        muted = true;
      }
    },

    unmute: function(){
      if(muted) {
        Volume.set(oldvolume, true);
        muted = false
      }
    }
  };
})();

when("io", function(){
  _socket = io.connect('http://' + window.location.hostname + ':1985/');
  _socket.on("stats", function(d) { $("#channel-stats").html(d.online + " partying"); });
  _socket.on("channel-results", Channel.gen);
  _socket.on("song-results", Song.gen);

  _socket.on("song", function(d) {
    _song = d;
    transition(d);
  });

  _socket.on("uid", function(d) { Store("uid", d); });
  _socket.on("channel-name", function(d){ _ev("channel", d); });
  _socket.on("username", User.login);
  Chat.Init();
});

when("$", function (){
  when("io", function(){
    _socket.on("channel-results", function(all) {
      if(_ev("app-state") != "splash") {
        return;
      }
      $("#videoList").empty();
      _.each(all, function(row) {
        $("#videoList").append( 
          Channel.display(row, function(){ Channel.set(row.name); })
        );
      });
    });
  });
  _ev("app-state", function(state) {
    if(state == "channel") {
      $("#splash").hide();
      $("#app").show();
      Panel.show("chat");
    } else if (state == "splash") {
      $("#splash").show();
      $("#app").hide();
      _ev.isset("greeted", function(){
        send( "get-channels", {query: false});
      });
    }
  });

  $(".btn.collapse").click(function(){ Panel.hide(this.parentNode.id); });
  $("#lhs-expand").click(function(){ Panel.show("chat"); });
  $("#channel-expand").click(function(){ Panel.toggle("channel"); });
  $("#song-expand").click(function(){ Panel.show("song"); });

  onEnter("#talk", Chat.send);

  Channel.Init();
  User.Init();

  when("_", Song.Init);

  Volume.Init();

  if(_channel) {
    Channel.set(_channel);
  } else {
    _ev.set('app-state','splash');
  }

  var hash = window.location.hash;
  setInterval(function(){
    if(window.location.hash != hash) {
      hash = window.location.hash;
      if(hash.slice(1).length) {
        Channel.set(hash.slice(1));
      } else {
        _ev('app-state', 'splash');
      }
    }
  }, 1000);
});


// Load the first player
Player.load("yt", 0);
