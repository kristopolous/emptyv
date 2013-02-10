function when(prop, cb) {
  if(self[prop]) {
    return cb();
  }

  var ival = setInterval(function(){
    if(self[prop]) {
      cb();
      clearInterval(ival);
    }
  }, 25);
}

function loadsrc(row) {
  setTimeout(function(){
    log("Loading " + row[1]);
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.src = row[1];
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
  }, row[0]);
}

loadsrc([10, 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js']);
loadsrc([2000, 'js/db.min.js']);
loadsrc([5000, 'js/jquery-ui-1.8.20.custom.min.js']);

if(!self.console) {
  self.console = {log:function(){}};
}
if(!self.localStorage) {
  self.localStorage = {};
}

var
  MYCOLOR = Math.floor(Math.random() * 10),

  // The offset addition was after some toying around and 
  // seeint how long the player took to load. This seemed
  // to work ok; we really want the drift to be as close
  // to 0 as possible.
  LOADTIME_sec = 5,

  // An extra player
  EXTRA = 2,

  // According to the docs: "The player does not request 
  // the FLV until playVideo() or seekTo() is called.". In
  // order to combat this, we have to pre-load the video
  // by some increment, we take that to be the LOADTIME,
  PRELOAD = 3,

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium"];//, "large", "hd720", "hd1080", "highres"];

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
        node.css('background', 'none');
        if (cb) {
          cb(node);
        }
        clearInterval(ival);
      } else {
        node.css("background", ["#79889c", "#172131"][iter % 2]);
      }
      iter--;
    }, 150);
}

function send(func, data) {
  when("_socket", function(){
    log("emitting " + func);
    _socket.emit(func, data);
  });
}

function stack() {
  try { throw new Error(); }
  catch (e) { console.log(
    e.stack
      .replace(/^[^@]*/mg, '')
      .replace(/\n[^@]*/mg, '\n   ')
    || e.stack);
  }
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
      _song.stop - 
      player.getCurrentTime()
    );
  } 
  return 0;
}

function plural(num, mod, base) {
  if(num % mod != 1) { return base + "s"; }
  return base;
}

function secondsToTime(count) {
  var stack = [];

  stack.push((Math.floor(count) % 60) + plural(count, 60, " second"));

  count = Math.floor(count / 60);

  if (count > 0) {
    stack[0] = (count % 60) + plural(count, 60, " minute") + " and " + stack[0];
    count = Math.floor(count / 60);;
  }

  if (count > 0) {
    stack.push((count % 24) + plural(count, 24, " hour"));
    count = Math.floor(count / 24);
  }

  if (count > 0) {
    stack.push((count % 7) + plural(count, 7, " day"));
    count = Math.floor(count / 7);
  }

  if (count > 0) {
    stack.push((count % 2) + plural(count, 2, " week"));
    count = Math.floor(count / 2);
  }

  return stack.reverse().join(', ').replace(/^0/,'');
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

  _unit = 60 * 60,
  _goal = _unit,

  _volume = Store("volume") || 1,

  _ev = EvDa({
    "app-state": "splash"
  }),

  _index = -1,

  _socket = false,

  _seekTimeout = 0,
  _qualityTimeout = 0,

  _counter = parseInt(Store("ttl") || 0),
 
  _start = getNow(),

  _letterBoxed = false,

  // How many of the YT players are loaded
  _loaded = 0,

  _channel = '',

  // And their associated references
  _player = [],
  _playerPrev, 
  _playerByDom = {yt:[], dm:[]},
  _playerById = {},

  _song,
  _next = 0;

// }} // Globals

_ev.sniff();

function Store(key, value) {
  if(arguments.length == 2) {
    localStorage[key] = value;
  }
  return localStorage[key];
}

var Player = (function(){

  self.onYouTubePlayerReady = function(id) { onReady("yt", id); }

  function check(player) {
    return (player && player.style);
  }

  function move(el, start, end, cb) {
    var 
      top = start,
      interval = (start > end) ? -18 : 18,
      ival = setInterval(function(){
        el.style.top = top + "%";
        top += interval;
        if( (interval > 0 && top >= end) ||
            (interval < 0 && top <= end)
          ) {
            el.style.top = end + "%";
            clearInterval(ival);
            if(cb) {
              cb(el);
            }
        }
      }, 50);
  }

  function hide(player, transition) {
    if(check(player)) {
      if(transition && !_letterBoxed) {
        document.body.style.overflowY = "none";
        move(player, 0, 100, function(el) {
          document.body.style.overflowY = "auto";
          el.style.left = "-1000%";
          el.style.top = "0";
        });
      } else {
        player.style.left = "-1000%";
      }
    }
  }

  function show(player, transition) {
    if(check(player)) {
      if(transition && !_letterBoxed) {
        player.style.left = 0;
        move(player, -100, 0, function(el) {
          el.style.left = "-0%";
        });
      } else {
        player.style.left = 0;
        player.style.top = 0;
      }
    }
  }

  function secondarySwap(){
    var swapInterval = setInterval(function(){
      if (_playerById[_index].getCurrentTime() < _player[EXTRA].getCurrentTime()) {

        // Nows our time to shine
        _playerById[_index].playVideo();
        _playerById[_index].setVolume(_song.volume * _volume);
       
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

      when("_song", function(){
        var ttl = _counter + (getNow() - _start);
          _goal = (1 + Math.floor(ttl / _unit)) * _unit;
        setInterval(function (){
          var ttl = _counter + (getNow() - _start);

          Store("ttl", ttl);
          if(ttl > _goal) {
            Chat.addmessage("Total Time On Site: " + secondsToTime(ttl));
            _goal = (1 + Math.floor(ttl / _unit)) * _unit;
          }
          document.title = _song.artist + " - " + _song.title + " | " + secondsToTime(ttl);
        }, 1000);

        Player.load("yt", 1);
        Player.load("yt", 2); 
      });
    } else {
      Player.hide(_player[id]);
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
    if(_song.notes.search("240p") > 0) {
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
        _song.stop - 
        _playerById[_index].getCurrentTime() > LOADTIME_sec * 2.5
      ) {

        // First, load the active video in the extra player,
        // setting the volume to 0
        _player[EXTRA].loadVideoById(
          _song.vid.split(":")[1], 
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
              _player[EXTRA].setVolume(_song.volume * _volume);
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
      log("Loading " + domain + ":" + ix);
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
        { wmode: "transparent" },       // flash vars 

        { allowScriptAccess: "always" }, // params

        { id: 'player-' + ix, wmode: "transparent" } // attributes
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
      $("#video-overlay").css({
        height: "162px",
        width: "216px"
      });
      $("#top").css({
        paddingTop: "170px"
      });
      $("#mute-control").css({
        top: "187px"
      });
    },
    flashSwap: function(opts) {
      var counter = 9,
        ival = setInterval(function() {
          if(counter % 2) {
            Player.hide(opts.show);
            Player.show(opts.hide);
          } else {
            Player.hide(opts.hide);
            Player.show(opts.show);
          }
          counter --;
          if(counter < 0) {
            clearInterval(ival);
          }
        }, 100);
    },
    hide: hide,
    setQuality: setQuality,
    show: show,
    safeLoad: function(el, id, offset) {
      var og_size = {
        left: $(el).position().left,
        top: $(el).position().top,
        width: $(el).width(),
        height: $(el).height()
      };

      if(_letterBoxed) {
        el.style.width = og_size.width + 800 + "px";
        el.style.left = "-800px";
        el.style.height = og_size.height + 600 + "px";
        el.style.top = "-600px";

        setTimeout(function(){
          console.log(og_size);
          el.style.top = og_size.top + "px";
          el.style.left = og_size.left + "px";
          el.style.width = "100%";
          el.style.height = "100%";
        },500);
      }

      if (id) {
        el.loadVideoById(id, offset);
      }
    },
    fullscreen: function(){
      if(_letterBoxed) {
        _letterBoxed = false;
        $("#video-overlay").css({
          height: 0,
          width: 0
        });
        $("#players").css({
          height: "100%",
          width: "auto",
          paddingTop: 0
        });
        $("#mute-control").css({
          top: "5px"
        });
        $("#top").css({
          paddingTop: "0"
        });
      }
    }
  }
})();

function transition(song) {

  log("Loading song:", song); 
  _song = song;
  // Load the next video prior to actually switching over
  var 
    id = song.vid,
    offset = song.offset,
    index = id,
    dom = 'yt',
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

  // This function is called at the time that we want to start our process.
  // Currently it's -PRELOAD seconds before we should be showing the video.
  //
  // Optimistically, this would mean that there is PRELOAD seconds left in
  // the current video, but oftentimes more.
  _ev.isset(dom + _next, function() {

    // The amount of time we have to transition is 
    // The minimum of the remaining time in the video and the lead time
    //
    // By this point, we have already loaded the video with
    // enough time for a video commercial and then let that
    // play in hiding.  The video itself should have started too
    // so we should have some of it buffered already and then
    // can just seek back without a buffering issue.
    var 
      pivot = Math.min(PRELOAD, remainingTime(_playerPrev[_active])) * 1000,

      // raise the volume of the next one slightly before dropping
      // the volume of the current
      raiseNextVolume = pivot - 500,

      // drop the volume of the currently playing song
      dropPlayingVolume = pivot + 250,

      // Stop the old video 1 second after the
      // pivot transition
      stopOldVideo = pivot + 1000,

      // These will change somewhere in the 
      // mess so we store it locally.
      active = _player[_active],
      next = _player[_next];

    Player.safeLoad(next, uuid, Math.max(offset, 0));

    next.setPlaybackQuality("medium");
    next.setVolume(0);
    next.playVideo();

    log("video loaded");

    setTimeout(function(){
      $("#video-current").html("<b>Loading next song ...</b>" + [_song.artist, _song.title].join(' - '));

      log("raise next volume");
      next.seekTo(Math.max(offset, 0));
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
      // the volume adjusting
      setTimeout(function(){
        next.setVolume(song.volume * _volume);
      }, 100);
    }, raiseNextVolume);

    setTimeout(function(){
      $("#video-current").html("<b>" + _song.artist + "</b>" +  _song.title);
      log("pivot");

      // Toggle the player pointers
      _active = (_active + 1) % 2;
      _next = (_active + 1) % 2;

      // When you toggle the visibility, there is still an annoying spinner.
      // So to avoid this we just "move" the players off screen that aren't
      // being used.
      /*
      Player.flashSwap({
        hide: active,
        show: next
      });
      */
      Player.show(next, 'slide');
      Player.hide(active, 'slide');
      Player.hide(_playerPrev[EXTRA]);

      next.index = index;
      _playerById[index] = _player[_active];

      _index = index;
      _playerPrev = _player;
    }, pivot);

    setTimeout(function(){ 
      log("drop playing volume");
      if(active) {
        Volume.fadeById(active);
      }
    }, dropPlayingVolume);

    setTimeout(function(){
      if(active) {
        log("stopping old video");
        active.stopVideo();
        if("index" in active) {
          delete _playerById[active.index];
        }
      }
    }, stopOldVideo);
  });
}

var User = (function(){
  var 
    loggedin = false,
    reg = false,
    forgot = false,
    fun = ['slideUp','slideDown'];

  function gen(){
    if(reg == true) {
      forgot = false;
    }
    $("#login-wrap")[fun[+!forgot]]();
    $("#email-wrap")[fun[+(forgot || reg)]]();
    $("#register-button").html(["I'm new","Actually, I've been here"][+reg]);
    $("#user-login").html(["Login", "Register", "Password Reset"][reg + forgot * 2]);
    if(forgot) {
      $("#input-username,#input-password").val("");
    } else if(!reg) {
      $("#input-email").val("");
    }
  }

  function logout(){
    loggedin = false;
    $("#login-button").html("Log in");
    $("#display-username").html("You are anonymous.");
    send("set-user", {user: false});
  }

  return {
    showError: function(obj) {
      blink($("#user-error").html(obj.text));
    },
    Init: function(){
      _ev.on("panel:user", function(which) {
        if(which == "show") {
          $("#login-button").fadeOut(function(){
            $("#input-username").focus();
          });
          forgot=reg=false;
          gen();
        } else {
          $("#login-button").fadeIn();
          $("#talk").focus();
        }
      });
      $("#forgot-button").click(function(){
        forgot = !forgot;
        reg=!forgot;
        gen();
      });
      $("#login-button").click(function(){
        if(loggedin) {
          logout();
        } else {
          Panel.show("user");
        }
      });

      $("#user-cancel").click(function(){ Panel.hide("user"); });
      $("#user-login").click(User.setuser);
      $("#register-button").click(function(){
        reg = !reg;
        gen();
      });

      onEnter("#input-username,#input-password,#input-email", User.setuser);
    },
    login: function(who){
      $("#user-control").css('visibility', 'visible');
      if(!who) {
        if(loggedin) {
          logout();
        }
      } else {
        Panel.hide("user");
        loggedin = true;
        $("#display-username").html("You are " + who + ".");
        $("#login-button").html("Log out");
      }
    },
    setuser: function() {
      send("set-user", {
        user: $("#input-username").val(),
        password: $("#input-password").val(),
        email: $("#input-email").val()
      });
    }
  };
})();

var Song = (function(){
  var 
    _editing = false,
    _lastSong = false,
    _db = {};

  function preview(obj,el) {
    Panel.show("song");
    if(el) {
      blink($(el), function(){setTimeout(Volume.fademute, 1500);});
    }

    _lastSong = obj;

    var 
      id = obj.vid.split(':').pop(),
      width = 300,
      height = width * 3 / 4;
    

    $("#preview-controls").slideDown();
    $("#song-preview").animate({height: "225px"});

    $("#embedder").html('<object width=' + width + ' height=' + height + '>' +
      '<param name="movie" value="http://www.youtube.com/v/' + id + '?version=3&amp;hl=en_GB&amp;autoplay=1"></param>' + 
      '<param name="allowscriptaccess" value="always"></param>' + 
      '<embed src="http://www.youtube.com/v/' + id + '?version=3&amp;hl=en_GB&amp;autoplay=1" type="application/x-shockwave-flash" width=' + width + ' height=' + height + ' allowscriptaccess="always"></embed>' +
      '</object>');

    $("#preview-artist").html(obj.artist);
    $("#preview-title").html(obj.title);
    blink("#song-preview-info"); 
    //$("#title-edit").css('display','inline-block');
  }

  function panelFlash() {
    switch(_ev("song-tab")) {
      case 'Everything':
        if(!_db[_channel]) {
          _socket.emit("get-all-videos", 0, 10000);
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
    preview: preview,
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

      $("#song-results").css({height: $(window).height() - 138});
      $(window).resize(function(){
        $("#song-results").css({height: $(window).height() - 138});
      });

      $("#song-show-history").click(function(){
        _socket.emit("get-history");
      });

      $("#video-overlay,#song-select-cancel").click(function(){
        Panel.hide("song");
      });

      $("#song-delist").click(function() {
        Panel.hide("song");
        _socket.emit("delist", _lastSong);
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
        Panel.hide("song");
        _socket.emit("skip", _song.vid);
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
          Volume.unmute();
          Player.fullscreen();
          $("#input-song-search").val("");
          $("#song-results").empty();
          $("#song-search-label-container").css('display','none');
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

    reset: function() {
      $("#embedder").empty();
      $("#preview-controls").slideUp();
      $("#song-preview").css("height", 0);
    },

    format: function(data, type) {
      if(!data.vid) {
        return;
      }
      var 
        node = $("<a class=title />")
          .append("<img src=http://i3.ytimg.com/vi/" + data.vid.split(':').pop() + "/1.jpg>");

      if(type != 'dummy') {
        node.click(function(){ 
          preview(data, node);
        });
      }

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
      $("#song-search-label-container").fadeIn();
    },

    gen: function(data) {
      var 
        type,
        container,
        titles = {
          local: "Existing",
          remote: "New",
          history: ""
        };

      if(data.query) {
        type = 'search';
        container = "#song-results";
        if(data.results.total) {
          $("#song-search-label").html("Searched for <b>" + data.query + "</b>");
        } else {
          $("#song-search-label").html("Nothing found for <b>" + data.query + "</b> :-(");
        }
      } else {
        type = 'history';
        container = "#timeline-content";
      }

      $(container).empty();

      _.each(_.keys(titles), function(which) {
        if(data.results[which] && data.results[which].length) {
          _.each(data.results[which], function(row) {
            Song.format(row, type).appendTo(container);
          });
        }
      });
    }
  }
})();

var Channel = {
  Init: function(){
    when("_socket", function(){
      _ev("channel", function(name) {
        $("#channel-title").html(name);
      });

      _ev("panel:channel", function(which){
        if(which == "show") {
          send("get-channels", {query: false});
        }
      });

      onEnter("#input-channel-search", Channel.search);
      _socket.on("playlist", function(last) {
        console.log(last);
      });

      $("#channel-query").keyup(function(){
        Channel.search(this.value);
      });
    });
  },

  splashshow: function(all){
    if(_ev("app-state") != "splash") {
      return;
    }
    when("$", function(){
      when("_", function(){
        $("#videoList-content").empty();
        _.each(all.chan, function(row) {
          $("#videoList-content").append( 
            Channel.display(row, function(){ window.location.hash=row.name; })
          );
        });
        _chat.data = all.chat;
        _chat.lastid = _chat.data[_chat.data.length - 1]._id;
        //Chat.showmessage("#recentList-content");
      });
    });
  },

  set: function(which) {
    _ev('app-state', 'channel');
    _channel = which;
    send("channel-join", {channel: which});
    document.location.hash = which;
    Chat.reset();
  },

  display: function(obj, cb) {
    var base = (Song.format(obj, 'dummy'));
    $("span", base).prepend("<em>" + obj.name + "</em>");
    $("span", base).append("<small>" + (obj.count ? ( obj.count + " partying" ) : "Be the first") + "</small>");

    return $("<div class=channel />").append(base).click(cb);
  },

  gen: function(res) {
    if(_ev("app-state") == "splash") {
      return;
    }
    $("#channel-results").empty();

    _.each(res, function(which) {
      Channel.display(which, function(){
        blink($(this), function(){
          Panel.hide("channel");
        });
        window.location.hash = which.name;
      }).appendTo("#channel-results")
    });
  },

  playlist: function(start, end) {
    send("playlist", {
      channel: _channel,
      begin: start || -10,
      end: end || 10
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
    if(self.$ && _channel) {
      $("#message").empty();

      if(!_ev.isset("greeted")) {
        send("greet-response", {
          color: MYCOLOR,
          uid: Store("uid"),
          lastid: _chat.lastid,
          channel: _channel
        });
      }
      _ev.set("greeted");
    }
  }

  function Init(){
    reset();
    _ev.on("panel:chat", function(which) {
      if(which == "hide") {
        Player.fullscreen();
      }
    });

    when("$", function(){
      function resize() {
        $("#message,#message-wrap").css({
          height: $(window).height() - 140 - ($("#user-control").height() + $("#talk").height())
        });
      }
      resize();
      $(window).resize(resize);
      // There's a race condition here ... so we run this twice.
      setTimeout(resize, 3000);

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

  var 
    format = {
      announce: function(data) {
        return "<p class=announce>" + data.text + "</p>";
      },

      _baseVideo: function(data) {
        var id = data.id.split(':').pop();
        return $("<a class=title />").click(function(){
            Song.preview({
              vid: data.id,
              title: data.title,
              artist: data.artist
            }, this);
          }).append( "<b>" + data.artist + "</b>" + data.title);
      },

      skip: function(data) {
        return format._baseVideo(data);
      },
      delist: function(data) {
        return format._baseVideo(data);
      },
      play: function(data) {
        return format._baseVideo(data);
      },
      request: function(data) {
        return format._baseVideo(data, 'Delisted');
      },
      chat: function(data) {
        return data.text;
      }
    },
    author = {
      chat: function(row, entry) {
        $("<div/>")
          .addClass("author")
          .html(row.who)
          .click(function(){
            if(entry.expanded) {
              return;
            } else {
              entry.expanded = true;
              showContext(row);
            }
          }).appendTo(entry);
      },

      skip: function(row, entry) {
        $("<div/>")
          .addClass("author")
          .html("Skipped by " + row.who).appendTo(entry);
      },

      delist: function(row, entry) {
        $("<div/>")
          .addClass("author")
          .html("Delisted by " + row.who).appendTo(entry);
      },

      request: function(row, entry) {
        $("<div/>")
          .addClass("author")
          .html("requested by " + row.who).appendTo(entry);
      },

      play: function(row, entry) {
        $("<div/>")
          .addClass("author")
          .html("Currently Playing").appendTo(entry);
      }
    },
    append = {
      announce: function(lastentry, entry, haveMore) {
        lastentry.html(entry);
        if(!haveMore) {
          blink(lastentry);
        }
      },
      play: function(lastentry, entry, haveMore) {
        $(entry).insertAfter(
          lastentry.get(0).lastChild.previousSibling
        );
        if(!haveMore) {
          blink(lastentry);
        }
      }
    },
    post = {
      play: function(container, entry, isFirst){
        if(isFirst) { return; }

        if(_chat.lastentry.get(0).childNodes.length > 2) {
          $(_chat.lastentry.get(0).firstChild).remove();
        }
      },
      chat: function(container, entry, isFirst) {
        $("a", entry).attr("target", "_blank");
      }
    },
    combine = {
      play: function(previous, current) {
        if(previous.type == 'request' && previous.id == current.id) {
          _chat.lastentry.get(0).lastChild.innerHTML = "Requested to play now by " + previous.who + ".";
          return true;
        }
      },
      delist: function(previous, current) {
        if(previous.id == current.id) {
          if(previous.type == 'play') {
            _chat.lastentry.get(0).lastChild.innerHTML = "Skipped and delisted by " + current.who + ".";
            return true;
          } else if(previous.type == 'skip') {
            _chat.lastentry.get(0).lastChild.innerHTML = "Skipped and delisted by " + current.who + ".";
            return true;
          } 
        }
      },
      skip: function(previous, current) {
        if(previous.id == current.id) {
          if(previous.type == 'delist') {
            _chat.lastentry.get(0).lastChild.innerHTML = "Skipped and delisted by " + previous.who + ".";
            return true;
          } else if(previous.type == 'play') {
            _chat.lastentry.get(0).lastChild.innerHTML = "Skipped by " + current.who + ".";
            return true;
          } 
        }
      }
    };
    
  function showContext(){
  }

  function showmessage(container) {
    var 
      entry, 
      row,
      color;

    container = container || "#message";
    while(_chat.data.length > lastindex) {

      row = _chat.data[lastindex];

      // Only display rows that we know how to
      // display. We can collapse similar entries
      if(format[row.type]) {

        if(!_chat.lastrow || !combine[row.type] || !combine[row.type](_chat.lastrow, row)) {
          entry = format[row.type](row);

          if(
              !_chat.lastentry || 
              ( _chat.lastuid != row.uid ) ||
              ( _chat.type != row.type ) 
            ) {

            // If this is a new author or the first entry 
            // then we create a new entry
            _chat.lastentry = entry = $("<div>").addClass(row.type).html(entry);

            // If it's a human, it will have a color
            if('color' in row) {
              entry.addClass("c" + row.color);
            }
            if(author[row.type]) {
              author[row.type](row, entry);
            }

            // Truncate the log after some 
            // containers of messages.
            if(entryList.length > 40) {
              entryList.shift().remove();
            }

            entryList.push(entry);
            $(container).append(entry);

            // This is needed if the author says further things
            // before someone else.
            _chat.type = row.type;
            if(post[row.type]) {
              post[row.type](_chat.lastentry, entry, true);
            }
          } else {
            if(append[row.type]) {
              append[row.type](_chat.lastentry, entry, _chat.data.length > (lastindex + 1));
            } else {
              $(entry).insertAfter(
                _chat.lastentry.get(0).lastChild.previousSibling
              );
            }
            if(post[row.type]) {
              post[row.type](_chat.lastentry, entry, false);
            }
          }
        }

        // A value of undefined here is a-ok.
        _chat.lastuid = row.uid;
      }
      
      _chat.lastrow = row;
       
      lastindex++;
    }
  }

  return {
    Init: Init,
    showmessage: showmessage,
    addmessage: addmessage,
    send: function(){
      var message = $("#talk").val();
      if(message.length) {
        send("chat", { 
          d: message,
          vid: _song ? _song.vid : 0,
          offset: _song ? _playerById[_song.vid].getCurrentTime() : 0
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
      _.each(["channel-detail", "user", "channel"], function(which){
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

var Volume = (function(){
  var 
    oldvolume,
    ival,
    muted = false; 

  return {
    fadeById: function(id, cb) {
      var vol = id.getVolume();
      ival = setInterval(function(){
        vol -= 10;
        if(vol < 0) {
          id.setVolume(0);
          clearInterval(ival);
          if(cb) {
            cb();
          }
          return;
        }
        log("Setting volume to " + vol);
        id.setVolume(vol);
      },40);
    },
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

      $(document.body).mouseup(function(){ _mousedown = false; });

      $(document.body).mousedown(function(){
        _expanded = true;
        toggle();
      });
      $("#mute-control .expanded").mousedown(function(e){
        _mousedown = true;
        var offset = 65;
        if(_letterBoxed) {
          offset += 167;
        }
        Volume.set(1 - (e.pageY - offset) / 100);
        return false;
      }).mousemove(function(e){
        var offset = 65;
        if(_letterBoxed) {
          offset += 167;
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
      muted = false;

      if(!nostore) { 
        Store("volume", _volume);
      }

      var ceiling = _song.volume;

      $("#mute-fg").css('height', (_volume * 100) + "px");

      if(_playerPrev && _playerPrev[_active]) {
        _playerPrev[_active].setVolume(ceiling * _volume);
      }
    },

    fademute: function(){
      if(!muted && _ev('panel:song') == 'show') {
        muted = true;
        oldvolume = _volume;
        log("Starting the fade mute");
        var vol = _volume;
        ival = setInterval(function(){
          _player[_active].setVolume(_song.volume * vol);
          vol -= 0.03;
          if(vol < 0) {
            log("Done with the fade mute");
            _player[_active].setVolume(0);
            _volume = 0;
            clearInterval(ival);
          }
        },40);
      }
    },
    mute: function(){
      if(!muted) {
        oldvolume = _volume;
        Volume.set(0, true);
        muted = true;
      }
    },

    unmute: function(){
      if(muted) {
        clearInterval(ival);
        log("unmuted to " + oldvolume);
        Volume.set(oldvolume, true);
      }
      muted = false;
    }
  };
})();

when("io", function(){
  _socket = io.connect('http://' + window.location.hostname + ':1985/');
  _socket.on("stats", function(d) { $("#channel-stats").html(d.online + " partying"); });
  _socket.on("channel-results", Channel.gen);
  _socket.on("song-results", Song.gen);
  _socket.on("song", transition);
  _socket.on("uid", function(d) { Store("uid", d); });
  _socket.on("channel-name", function(d){ _ev("channel", d); });
  _socket.on("username", User.login);
  _socket.on("user-error", User.showError);
  Chat.Init();
});

when("$", function (){
  when("io", function(){
    _socket.on("channel-results", Channel.splashshow);
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

  $(".collapse").click(function(){ Panel.hide(this.parentNode.id); });
  $("#lhs-expand").click(function(){ Panel.show("chat"); });
  $("#channel-wrap").click(function(){ Panel.toggle("channel"); });
  $("#song-expand").click(function(){ Panel.show("song"); });

  onEnter("#talk", Chat.send);

  Channel.Init();
  User.Init();
  Volume.Init();

  when("_", Song.Init);

  if(_channel) {
    Channel.set(_channel);
  } else {
    _ev.set('app-state','splash');
  }

  var hash = "";
  setInterval(function(){
    if(window.location.hash != hash) {
      hash = window.location.hash;
      if(hash.slice(1).length) {
        Channel.set(hash.slice(1));
      } else {
        _ev('app-state', 'splash');
      }
    }
  }, 100);
});

// Load the first player
//Player.load("yt", 0);
