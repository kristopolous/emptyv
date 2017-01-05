
function getData() {
  var 
    outstanding = "2TKQcWEXSKU",
    index = 0,
    id = 0, 
    ival,
    tries = 0, 
    map = {};

  function playIt() {
    if(id !== 0 && _player[1].getDuration() > 0) {
      map[id] = _player[1].getDuration();
      console.log(index, map);
    } 
    id = outstanding[index];
    _player[1].loadVideoById(id);
    index ++;
    tries = 0;
  }
  
  ival = setInterval(function() {
    if(index >= outstanding.length) {
      clearInterval(ival);
    }
    if(_player[1].getDuration() > 0) {
      playIt();
    }   
    if(++tries > 20) {
      playIt();
    }
  }, 300);
}
