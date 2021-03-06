var 
  _db,
  _pubsub;

/*
 * There's an optimization we can do here.
 * Basically, we don't want large playlists,
 * that get compacted, to be eat up the log.
 *
 * Especially since this has to transit over
 * the wire on load currently.
 */
var _types = {};

module.exports = {
  append: append,
  add: add,
  setDB: function(db, pubsub) {
    _db = db;
    _pubsub = pubsub;
  },
  announce: function(message) {
    _db.incr("ix", function(err, id) {
      var payload = [ 
        id, 
        "<p class=announce>" + message + "</p>"
      ];
      add("log:" + _user.channel, payload);
    });
  }
};

function append(key, data, size) {
  var value = JSON.stringify(data);
  _db.rpush(key, value);
  _pubsub.publish("pub:" + key, value);

  /*
   * We don't trim every time and we don't
   * ask for the length every time and
   * we try to be stateless. So we just
   * roll a 10 sided die and move if it
   * lands on a 5.
   */
  if(Math.floor(Math.random() * 10) == 5) {
    _db.ltrim(key, -(size || 100), -1);
  }
}

function add(channel, obj) {
  console.log(channel, obj);
  /*
   * I'd rather crash here then be quiet.
  if(!channel) {
    return;
  }
  */

  /*
   * In this instance, we just replace
   * the most recent and assume it will
   * be done before we put something else
   * on.
   */
  if((obj.type == _types[channel]) && ["play"].indexOf(obj.type) > -1) {
    _db.rpop("log:" + channel);
  }

  _types[channel] = obj.type;

  _db.incr("ix", function(err, id) {
    obj._id = id;
    obj._ts = +(new Date());
    append("log:" + channel, obj);
    if (["request", "chat"].indexOf(obj.type) > -1) {
      obj.c = channel;
      delete obj._ts;
      append("logall", obj, 30);
    }
  });
}
