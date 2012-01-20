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

  // An extra player
  EXTRA = 2,

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium", "large", "hd720", "hd1080", "highres"];

// }} // Constants

// Utils {{
function getNow(offset) {
  return +(new Date() / 1000) + (offset || 0);
}

function toTime(sec) {
  return [
    (sec / 3600).toFixed(0),
    ((sec / 60).toFixed(0) % 60 + 100).toString().substr(1),
    ((sec.toFixed(0) % 60) + 100).toString().substr(1)
  ].join(':');
}
  
// }} // Utils


// Globals {{
var 
  _active = 0,

  // This the the current playback quality index, which can be triggered
  // in a direction (either up or down) based on how successful we can
  // combat drift (basically by playing without hitting a buffer interval)
  //
  // We start at the lowest quality and then the skies the limit, I guess.
  _currentLevel = 0,
  _lagCounter = 0,

  _muted = false,

  _index = -1,
  _lastLoaded,

  _seekTimeout = 0,
  _qualityTimeout = 0,

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

  _lastTime = 0,

  _next = 1,
  _runtime = _.reduce(_duration, function(a, b) { return a + b[RUNTIME] }, 0);
// }} // Globals

function mutetoggle(el){
  _muted = !_muted;
  if(_muted) {
    el.src = "mute_on_32.png";
    _player[_active].setVolume(0);
  } else {
    el.src = "mute_off_32.png";
    // bug
    _player[_active].setVolume(100);
  }
}

// This sets the quality of the video along with
// supporting going down or up a notch based on
// what is detected, probably in findOffset
function setQuality(direction) {
  var 
    newQualityIndex = _currentLevel,
    newQualityWord,
                    
    activeAvailable = _player[_active].getAvailableQualityLevels(),
    activeQualityWord = _player[_active].getPlaybackQuality();

  // If no video is loaded, then go no further.
  if(activeAvailable.length == 0) {
    return;
  }

  // If the lapse has dropped and the direction is specific
  if(direction && getNow() > _qualityTimeout) {
    newQualityIndex = Math.min(
      Math.max(_currentLevel + direction, 0),
      LEVELS.length
    );

    // To make sure we don't cycle through the 
    // quality levels too quickly, there's a cool-off
    // time after a quality toggle.
    _qualityTimeout = getNow(+ YTLOADTIME_sec * 4);
  }

  // Now that we have the destination quality level, we need to see
  // if the current video playing has this quality level.
  newQualityWord = LEVELS[newQualityIndex];

  // If this video doesn't support the destination quality level
  if ( _.indexOf(activeAvailable, newQualityWord) == -1) {
    // Use the highest one available (the lower ones are always available)
    // Get the word version of the highest quality available
    newQualityWord = _.first(activeAvailable);
  }

  // If this new, supported quality isn't the current one set
  if (newQualityWord != activeQualityWord) {

    console.log("Quality: " + activeQualityWord + " => " + newQualityWord);

    // If we are downsampling then just do it
    if(true) { //direction < 0) {
      _player[_active].setPlaybackQuality(newQualityWord);

      // If we are upsampling, then do it seemlessly.
    } else if( 
      _player[_active].getDuration() - 
      _duration[_player[_active].index][STOP] - 
      _player[_active].getCurrentTime() > YTLOADTIME_sec * 2.5
    ) {

      // Ug, still experimental
      var index = _player[_active].index;

      // First, load the active video in the extra player,
      // setting the volume to 0
      _player[EXTRA].loadVideoById(_duration[index][ID].split(":")[1]) 

      _player[EXTRA].setVolume(0);

      // Set the playback quality of the extra video to the higher
      // quality
      _player[EXTRA].setPlaybackQuality(newQualityWord);

      // By seeking to the current time subtracted from the load time, then by the time this seeks
      // It should be eclipsed by the active player
      _player[EXTRA].seekTo(_player[_active].getCurrentTime() - YTLOADTIME_sec / 2);
      _player[EXTRA].playVideo();

      // Now poll the two time offsets and swap videos when they cross
      var swapInterval = setInterval(function(){
        console.log(_player[EXTRA].getVideoBytesLoaded(), _player[EXTRA].getCurrentTime());
        if (
          (_player[EXTRA].getCurrentTime() > 0) &&
          (_player[_active].getCurrentTime() > _player[EXTRA].getCurrentTime())
        ) {
          // Nows our time to shine
         
          // Bring the volume up of the higher quality player and mute the current
          _player[EXTRA].setVolume(_duration[index][VOLUME]);
          _player[_active].setVolume(0);

          // Start the higher quality player and stop the current one
          _player[EXTRA].playVideo();
          _player[_active].stopVideo();

          // Show the higher quality and hide the current one
          document.getElementById("player-" + _active).style.visibility = 'hidden';
          document.getElementById("player-" + EXTRA).style.visibility = 'visible';

          // now set the active to the extra, this works because the next mechanics
          // is based not on the previous next, but on the active; so there is no
          // odd/even problem.
          _active = EXTRA;

          // Set up the index
          _player[_active].index = _index;

          // And then clear the polling interval
          clearInterval(swapInterval);
        }
      }, 100);
    }

    // And set it as the default
    _currentLevel = _.indexOf(LEVELS, newQualityWord);
  }
}

function findOffset() {
  var 
    now = getNow(),
    lapse = (now - _epoch) % _runtime;

  for (var index = 0;

    lapse > _duration[index][RUNTIME];

    lapse -= _duration[index][RUNTIME],
    index = (index + 1) % _duration.length
  );

  // If the duration has a starting offset, then 
  // we put that here...
  lapse += _duration[index][START];

  if(_index > -1) {
    document.title = _duration[_index][ARTIST] + " - " + _duration[_index][TITLE] + " | " + toTime(now - _start);
    if(DEBUG) {
      var drift = _player[_active].getCurrentTime() - lapse;
      if(drift > 0) {
        drift = "+" + drift.toFixed(3);
      } else {
        drift = drift.toFixed(3);
      }

      document.title += " " + [drift, _lagCounter].join(' ');
    }
  }

  if (_duration[index][RUNTIME] - _player[_active].getCurrentTime() < 10) {
    _index = (index + 1) % _duration.length;
    transition(0);
  } else if (_index == -1) {
    _index = index;

    // Since we increment in the transition (sloppy, kiddo), then
    // we need to offset from that here.  That function should
    // probably be broken up better than it is currently.
    transition(lapse);
  }

  if ( now > _seekTimeout &&
      _player[_active].getCurrentTime() > 0 &&
      _player[_active].index == index
    ) {

    // If we have been buffering for a while, then we shift forward
    // then we will downsample and shift forward
    if ( _lastTime == _player[_active].getCurrentTime() ) {
      _lagCounter ++;
    } else {
      _lagCounter --;
    }
    _lastTime = _player[_active].getCurrentTime();

    // If the lagCounter is greater than 3, that means we've been
    // lagging quite a bit, then we try to reduce our quality
    if(_lagCounter > 12) {
      setQuality(-1);
      _lagCounter -= 12;

      console.log("seeking", lapse, _player[_active].getCurrentTime());

      // Make sure that we don't reseek too frequently.
      _seekTimeout = now + YTLOADTIME_sec;

      // We don't trust seeking to be insanely accurate so we throw an offset
      // on to it to avoid some kind of weird seeking loop.
      _player[_active].seekTo(lapse + YTLOADTIME_sec * 7 / 3);
    }

    // TODO: If our lagcounter is really low, then
    // we have been good and can up the quality at
    // this point; but have to be smart about it so
    // that we aren't just constantly cycling through
    // two quality settings, pausing the video annoyingly
    // every time we cycle up or down.
    if(_lagCounter < -12) {
      setQuality(+1);
      _lagCounter += 12;

      // Make sure that we don't reseek too frequently.
      _seekTimeout = now + YTLOADTIME_sec;
    } 
  }
}

function onYouTubePlayerReady(playerId) {
  var id = parseInt(playerId.substr(-1));
  _player[ id ] = document.getElementById(playerId);

  if(++_loaded == 3) {
    findOffset();
    setInterval(findOffset, 500);
  }
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

function transition(offset) {
  if(_index == _lastLoaded) {
    return;
  }
  _lastLoaded = _index;

  // Load the next video prior to actually switching over
  var 
    id = _duration[_index][ID],
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

    // Toggle the player pointers
    _active = (_active + 1) % 2;
    _next = (_active + 1) % 2;

    // When you toggle the visibility, there is still an annoying spinner.
    // So to avoid this we just "move" the players off screen that aren't
    // being used.
    document.getElementById("player-" + _active).style.left = "0%";
    document.getElementById("player-" + _next).style.left = "-200%";
    document.getElementById("player-" + EXTRA).style.left = "-200%";

    // Crank up the volume to the computed normalization
    // level.
    _player[_active].playVideo();
    _player[_active].index = _index;

    // Make sure that we observe the volume settings.
    if(_muted) {
      _player[_active].setVolume(0);
    } else {
      _player[_active].setVolume(_duration[_index][VOLUME]);
    }

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
