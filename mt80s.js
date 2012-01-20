// Constants {{
var
  ID = 0,

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

  // If there is a hash value (there should not be regularly)
  // Then debugging output is turned on, whatever the hell that
  // entails
  DEBUG = location.hash.length > 0,

  // The offset addition was after some toying around and 
  // seeint how long the player took to load. This seemed
  // to work ok; we really want the drift to be as close
  // to 0 as possible.
  YTLOADTIME_sec = 5,

  // According to the docs: "The player does not request 
  // the FLV until playVideo() or seekTo() is called.". In
  // order to combat this, we have to pre-load the video
  // by some increment, we take that to be the YTLOADTIME,
  // multiplied by 1000 because it's expressed in MS
  PRELOAD_ms = YTLOADTIME_sec * 1000,

  LAG_THRESHHOLD = 12,

  // An extra player
  EXTRA = 2,

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium"];//, "large"]; //, "hd720", "hd1080", "highres"];

// }} // Constants

// Utils {{
function getNow(offset) {
  return +(new Date() / 1000) + (offset || 0);
}

function remainingTime() {
  if(_player[_active] && _player[_active].getDuration && 'index' in _player[_active]) {
    return Math.max(0,
      _player[_active].getDuration() - 
      _duration[_player[_active].index][STOP] - 
      _player[_active].getCurrentTime()
    );
  } else {
    return 0;
  }
}

function toTime(sec) {
  return [
    (sec / 3600).toFixed(0),
    ((sec / 60).toFixed(0) % 60 + 100).toString().substr(1),
    ((sec.toFixed(0) % 60) + 100).toString().substr(1)
  ].join(':');
}

function hide(player) {
  document.getElementById("player-" + player).style.left = "-200%";
}

function show(player) {
  document.getElementById("player-" + player).style.left = 0;
}
  
// }} // Utils


// Globals {{
var 
  _active = 0,

  // This the the current playback quality index, which can be triggered
  // in a direction (either up or down) based on how successful we can
  // combat drift (basically by playing without hitting a buffer interval)
  //
  // We start at medium quality and then the skies the limit, I guess.
  _currentLevel = 0,
  
  // The lag counter is a token system that gets set by an interval.  If
  // we accumulate a certain negative or positive balance, then we can exchange
  // the negative or positive units for a quality shift. This makes sure that 
  // we can prove the stability of any setting through successive incremental
  // sampling
  _lagCounter = 0,

  _muted = false,

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
  _epoch = 1325138061 + ( _start - _referenceTime ),

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],
  _playerById = {},

  _lastTime = 0,

  _next = 1,
  _runtime = 0;

_.each(_duration, function(row) { 
  row[OFFSET] = _runtime;
  _runtime += row[RUNTIME];
});

// }} // Globals

function mutetoggle(el){
  _muted = !_muted;

  if(_muted) {
    el.src = "mute_on_32.png";
    _player[_active].setVolume(0);
  } else {
    el.src = "mute_off_32.png";
    var volume = 100;

    if ("index" in _player[_active]) {
      volume = _duration[_player[_active].index][VOLUME];
    }
    _player[_active].setVolume(volume);
  }
}

function secondarySwap(){
  var swapInterval = setInterval(function(){
    if (_playerById[_index].getCurrentTime()  < _player[EXTRA].getCurrentTime()) {

      // Nows our time to shine
      _playerById[_index].playVideo();
      if(!_muted) {
        _playerById[_index].setVolume(_duration[_index][VOLUME]);
      }
     
      // Bring the volume up of the higher quality player and mute the current
      _player[EXTRA].setVolume(0);
      _player[EXTRA].stopVideo();

      // Show the higher quality and hide the current one
      hide(EXTRA);
      show(_active);

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
    newQualityIndex = _currentLevel,
    newQualityWord,
                    
    activeAvailable = _playerById[_index].getAvailableQualityLevels().reverse().slice(0, 2),
    activeQualityWord = _playerById[_index].getPlaybackQuality();

  // If no video is loaded, then go no further.
  if(activeAvailable.length === 0) {
    return;
  }

  if(direction == -1) {
    _qualityTimeout = 20 * YTLOADTIME_sec + getNow();
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
  if ( _.indexOf(activeAvailable, newQualityWord) === -1) {
    eval(_inject("a"));
    console.log("NOT SUPPORTED", newQualityWord, activeAvailable);
    // Use the highest one available (the lower ones are always available)
    // Get the word version of the highest quality available
    newQualityWord = _.last(activeAvailable);
  }

  // If this new, supported quality isn't the current one set
  if (newQualityWord !== activeQualityWord) {

    console.log("Quality: " + activeQualityWord + " => " + newQualityWord);

    // If we are downsampling then just do it
    if(direction < 0) {
      // we also shuffle the placement forward to accomodate for the change over
      _playerById[_index].seekTo(_playerById[_index].getCurrentTime() + YTLOADTIME_sec);
      _playerById[_index].setPlaybackQuality(newQualityWord);

      // If we are upsampling, then do it seemlessly.
    } else if( 
      _playerById[_index].getDuration() - 
      _duration[_index][STOP] - 
      _playerById[_index].getCurrentTime() > YTLOADTIME_sec * 2.5
    ) {

      // First, load the active video in the extra player,
      // setting the volume to 0
      _player[EXTRA].loadVideoById(
        _duration[_index][ID].split(":")[1], 
        _playerById[_index].getCurrentTime() + YTLOADTIME_sec
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
            hide(_active);
            show(EXTRA);

            // Bring the volume up of the higher quality player and mute the current
            if(!_muted) {
              _player[EXTRA].setVolume(_duration[_index][VOLUME]);
            }
            myplayer.setVolume(0);
            myplayer.seekTo(_player[EXTRA].getCurrentTime() + 1.5);
            myplayer.setPlaybackQuality(newQualityWord);
            secondarySwap();
          }, 500);

          // And then clear the polling interval
          clearInterval(swapInterval);
        }
      }, 10);
    }

    // And set it as the default
    _currentLevel = _.indexOf(LEVELS, newQualityWord);
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

    document.title = _duration[_index][ARTIST] + " - " + _duration[_index][TITLE] + " | " + toTime(now - _start);
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
    if (_duration[_index][RUNTIME] - lapse < YTLOADTIME_sec * 2) {
      transition((_index + 1) % _duration.length, 0);
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
        _seekTimeout = now + YTLOADTIME_sec;
      }

      // If we have been buffering for a while, 
      // then we will downsample and shift forward
      if(_lagCounter > LAG_THRESHHOLD || drift < -YTLOADTIME_sec * 3) {
        setQuality(-1);
        _lagCounter -= LAG_THRESHHOLD;

        console.log("Seeking:", lapse, _playerById[_index].getCurrentTime());

        // We don't trust seeking to be insanely accurate so we throw an offset
        // on to it to avoid some kind of weird seeking loop.
        _playerById[_index].seekTo(lapse + YTLOADTIME_sec);
      }


      // If our lagcounter is really low, then
      // we have been good and can up the quality at
      // this point
      if(_lagCounter < -LAG_THRESHHOLD) {
        setQuality(+1);
        _lagCounter += LAG_THRESHHOLD;
      } 
    }
  }
}

function onYouTubePlayerReady(playerId) {
  var id = parseInt(playerId.substr(-1));
  _player[ id ] = document.getElementById(playerId);

  if(++_loaded === 3) {
    findOffset();
    setInterval(findOffset, YTLOADTIME_sec * 1000 / 10);
  }
}

function transition(index, offset) {
  if(index === _lastLoaded) {
    return;
  }
  _lastLoaded = index;

  // Load the next video prior to actually switching over
  var 
    id = _duration[index][ID],
    proto = id.split(':')[0],
    uuid = id.split(':')[1];

  console.log("Loading: ", id);

  // Offset mechanics are throughout, but placing it here
  // make sure that on first load there isn't some brief beginning
  // of video sequence then a seek.
  _player[_next].loadVideoById(uuid, offset);
  _player[_next].pauseVideo();

  setTimeout(function(){

    // After the PRELOAD_ms interval, then we stop the playing video
    _player[_active].stopVideo();
    if("index" in _player[_active]) {
      delete _playerById[_player[_active].index];
    }

    // Toggle the player pointers
    _active = (_active + 1) % 2;
    _next = (_active + 1) % 2;

    // When you toggle the visibility, there is still an annoying spinner.
    // So to avoid this we just "move" the players off screen that aren't
    // being used.
    show(_active);
    hide(_next);
    hide(EXTRA);

    // Crank up the volume to the computed normalization
    // level.
    _player[_active].playVideo();
    _player[_active].index = index;
    _playerById[index] = _player[_active];

    // Make sure that we observe the volume settings.
    if(_muted) {
      _player[_active].setVolume(0);
    } else {
      _player[_active].setVolume(_duration[index][VOLUME]);
    }

    _index = index;
    setQuality();
  }, remainingTime() * 1000);
}

(function(){
  // Load two players to be transitioned between at a nominal
  // resolution ... this is irrelevant as quality will be 
  // managed in a more sophisticated manner than size of screen.
  for(var ix = 0; ix < 3; ix++) {

    swfobject.embedSWF("http://www.youtube.com/apiplayer?" + [
      "version=3",
      "enablejsapi=1",
      "playerapiid=player-" + ix
    ].join('&'),  // swfUrl
      "vid" + ix, // id
      "400",      // width
      "300",      // height
      "9",        // [false] version (the flv2 player (flash 8) has ad-free vevo, so we use the old player)
      null,       // express install swf url (we assume you have the flash player)
      null,       // flash vars 

      {
        allowScriptAccess: "always"
      }, // params

      // This little hack forces our small mt80s logo to the bottom left so 
      // the user can click on it at any time.
      {
        wmode: "transparent", 
        id: 'player-' + ix
      }, // attributes

      new Function()                 // yt doesn't do the callbackfunction
    );
  }
})();
