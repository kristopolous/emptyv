

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
