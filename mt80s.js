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
  // The offset addition was after some toying around and 
  // seeint how long the player took to load. This seemed
  // to work ok; we really want the drift to be as close
  // to 0 as possible.
  YTLOADTIME_sec = 6,

  // According to the docs: "The player does not request 
  // the FLV until playVideo() or seekTo() is called.". In
  // order to combat this, we have to pre-load the video
  // by some increment, we take that to be the YTLOADTIME,
  // multiplied by 1000 because it's expressed in MS
  PRELOAD_ms = YTLOADTIME_sec * 1000,

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium", "large", "hd720", "hd1080", "highres"];

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

  // The epoch time is based off the system time AND the users
  // local clock.  This makes sure that separate clock drifts
  // are *about* the same ... minus the TTL latency incurred by
  // the emit from the server of course (which we assume to be fairly
  // constant).
  _start = +(new Date() / 1000),
  _epoch = 1325138061 + ( +(new Date() / 1000) - _referenceTime ),

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],

  _next = 1,
  _runtime = _.reduce(_duration, function(a, b) { return a + b[RUNTIME] }, 0);

function toTime(sec) {
  return [
    (sec / 3600).toFixed(0),
    ((sec / 60).toFixed(0) % 60 + 100).toString().substr(1),
    ((sec.toFixed(0) % 60) + 100).toString().substr(1)
  ].join(':');
}
  
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
  if(direction) {
    var 
      newLevel = Math.min(
        Math.max(_currentLevel + direction, 0),
        LEVELS.length
      );
    if(newLevel != _currentLevel) {
      console.log("Setting playback rate to " + LEVELS[_currentLevel]);
    }
    _currentLevel = newLevel;
  }

  var word = LEVELS[_currentLevel];

  // If this video supports the destination quality level
  if ( _.indexOf(_player[_active].getAvailableQualityLevels(), word) > -1

    // and it's not currently at it
    && _player[_active].getPlaybackQuality() != word
  ) {

    // Then we set it
    _player[_active].setPlaybackQuality(word);
  } else {
    _currentLevel = _.last(_player[_active].getAvailableQualityLevels());
    _player[_active].setPlaybackQuality(_currentLevel);
    _currentLevel = _.indexOf(LEVELS, _currentLevel);
  }
}

function findOffset() {
  var 
    now = +(new Date() / 1000),
    lapse = (now - _epoch) % _runtime;

  for (var index = 0;

    lapse > _duration[index][RUNTIME];

    lapse -= _duration[index][RUNTIME],
    index = (index + 1) % _duration.length
  );

  // If the duration has a starting offset, then 
  // we put that here...
  lapse += _duration[index][START];

  if(_player[_active].getCurrentTime) {
    console.log("DRIFT >>", _player[_active].getCurrentTime() - lapse);
  }

  if(_index > -1) {
    document.title = _duration[_index][ARTIST] + " - " + _duration[_index][TITLE] + " | " + toTime(+(new Date() / 1000) - _start);
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

  // If we have drifted more than xxx seconds from our destination offset
  // then we will shift forward
  if (_player[_active].index == index && lapse - _player[_active].getCurrentTime() > 18) {

    // This is also the opportunity to see if we are laggy.
    // We give our lagCounter 2 points here (and we always take
    // 1 off when we go through this function)
    _lagCounter = Math.max(_lagCounter + 1, 0);

    // If the lagCounter is greater than 3, that means we've been
    // lagging quite a bit, then we try to reduce our quality
    if(_lagCounter > 3) {
      setQuality(-1);
    }

    console.log("seeking", lapse, _player[_active].getCurrentTime());

    // We don't trust seeking to be insanely accurate so we throw an offset
    // on to it to avoid some kind of weird seeking loop.
    _player[_active].seekTo(lapse + YTLOADTIME_sec * 7 / 3);
  } 

  _lagCounter--;

  // TODO: If our lagcounter is really low, then
  // we have been good and can up the quality at
  // this point; but have to be smart about it so
  // that we aren't just constantly cycling through
  // two quality settings, pausing the video annoyingly
  // every time we cycle up or down.
  /*
   * This is buggy
  if(_lagCounter < -10) {
    setQuality(+1);
    _lagCounter += 10;
  } 
  */
}

function onYouTubePlayerReady(playerId) {
  var id = parseInt(playerId.substr(-1));
  _player[ id ] = document.getElementById(playerId);

  if(++_loaded == 2) {
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

  console.log(id);

  _player[_next].loadVideoById(uuid);
  _player[_next].pauseVideo();

  setTimeout(function(){
    // After the PRELOAD_msl interval, then we stop the playing video
    _player[_active].stopVideo();

    // Toggle the player pointers
    _active = (_active + 1) % 2;
    _next = (_next + 1) % 2;

    // And their visibility
    document.getElementById("player-" + _active).style.visibility = 'visible';
    document.getElementById("player-" + _next).style.visibility = 'hidden';

    // Crank up the volume to the computed normalization
    // level.
    _player[_active].playVideo();
    _player[_active].index = _index;
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
  for(var ix = 0; ix < 2; ix++) {

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