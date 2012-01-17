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

  // The offset addition was after some toying around and 
  // seeint how long the player took to load. This seemed
  // to work ok; we really want the drift to be as close
  // to 0 as possible.
  YTLOADTIME_sec = 6,

  // The inter-video gap is the admission that we don't
  // want to transition EXACTLY at the end of one and
  // the beginning of another, but instead want an acceptable
  // gap in between the two.
  INTERVIDEOGAP_ms = 2000,

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

  _index = -1,

  // The epoch time is based off the system time AND the users
  // local clock.  This makes sure that separate clock drifts
  // are *about* the same ... minus the TTL latency incurred by
  // the emit from the server of course (which we assume to be fairly
  // constant).
  _epoch = 1325138061 + ( +(new Date() / 1000) - _referenceTime ),

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],

  _next = 1,
  _nextFlag = true,
  _runtime = _.reduce(_duration, function(a, b) { return a + b[RUNTIME] }, 0);

function updateytplayer(){
  // If we have the player loaded
  if (    _player[_active].getCurrentTime() 

      // And the current time is near the end of the video (taking the stop offset into consideration)
      && (_player[_active].getDuration() - _player[_active].getCurrentTime() < (4 + _duration[_index][STOP])) 

      // And we haven't transitioned yet, then we do so.
      && (_nextFlag === true)
    ) {

    _index = (_index + 1) % _duration.length;
    transition();
  }
}

// This sets the quality of the video along with
// supporting going down or up a notch based on
// what is detected, probably in findOffset
function setQuality(direction) {
  if(direction) {
    var newLevel = Math.max(_currentLevel + direction, 0);
    if(newLevel != _currentLevel) {
      console.log("Setting playback rate to ", LEVELS[_currentLevel]);
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
  }
}

function findOffset() {
  // This is the transitioning mechanics.
  if ( ! _nextFlag ) {
    return;
  }

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

  if (index != _index) {
    console.log("Transitioning");
    _index = index;

    // Since we increment in the transition (sloppy, kiddo), then
    // we need to offset from that here.  That function should
    // probably be broken up better than it is currently.
    transition(lapse);

    // If we have drifted more than xxx seconds from our destination offset
    // then we will shift forward
  } else if ( Math.abs( _player[_active].getCurrentTime() - lapse) > 10) {

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
    _player[_active].seekTo(lapse + YTLOADTIME_sec);
  } 

  _lagCounter--;

  // TODO: If our lagcounter is really low, then
  // we have been good and can up the quality at
  // this point; but have to be smart about it so
  // that we aren't just constantly cycling through
  // two quality settings, pausing the video annoyingly
  // every time we cycle up or down.
}

function onYouTubePlayerReady(playerId) {
  _player[ parseInt(playerId.substr(-1)) ] = document.getElementById(playerId);

  if(++_loaded == 2) {
    findOffset();
    setInterval(findOffset, PRELOAD_ms + 500);
    setInterval(updateytplayer, 250);
  }
}

function transition(offset) {
  var id = _duration[_index][ID];
  _nextFlag = false;
  console.log(id);

  // Load the next video prior to actually switching over
  _player[_next].loadVideoById(id, offset + YTLOADTIME_sec);

  // Set the volume to 0 and start playing it, thus preloading it.
  _player[_next].setVolume(0);
  _player[_next].playVideo();

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
    _player[_active].setVolume(_duration[_index][VOLUME]);
    setQuality();

    _nextFlag = true;
  }, PRELOAD_ms);
}

function main() {
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
      "8",        // version (the flv2 player (flash 8) has ad-free vevo, so we use the old player)
      null,       // express install swf url (we assume you have the flash player)
      null,       // flash vars 
      {allowScriptAccess: "always"}, // params
      {id: 'player-' + ix},          // attributes
      new Function()                 // yt doesn't do the callbackfunction
    );
  }
}
