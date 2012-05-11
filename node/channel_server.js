var redis = require('redis')
  , mysql = require('mysql')
  , _db = redis.createClient()
  , _last = +(new Date())
  , _state = {}
  , _mysql = mysql.createClient({
    user: 'php',
    password: 'fixy2k'
  });

_mysql.query("USE mt80s");


function getVideo(ytid, cb) {
  _mysql.query("select * from videos where rid='yt:" + ytid + "'", function(err, res, fields) {
    cb(res[0]);
  });
}

function setVideo(video) {
  _mysql.query("select oid from library where cid=" + video.cid + " and vid = " + video.vid, function(err, res, fields) {
    if(res.length) {
      var row = res[0];
      for(key in row) {
        video[key] = row[key];
      }
      loadVideo(video);
    }
  });
}

function add(key, data) {
  _db.multi([
   [ "rpush", key, JSON.stringify(data) ],
   [ "ltrim", key, -15, -1]
  ]).exec();
}

function loadVideo(video) {

  var cid = video.cid;
  _state[cid] = video;
  _state[cid].offset = 0;
  _state[cid].volume = 100;
  _mysql.query("update channel set currentsong = " + video.vid + " where cid = " + video.cid);

  _db.incr("mt80s:ix", function(err, chat_id) {
    var id = video.rid.split(':').pop();

    add("mt80s:log:" + video.cid, [
      chat_id,
        "<a class=title target=_blank href=http://youtube.com/watch?v=" + id + ">" + 
         "<img src=http://i3.ytimg.com/vi/" + id + "/default.jpg>" +
         "<span>" +
           "<b>" + video.artist + "</b>" +  
           video.title +
         "</span>" +
       "</a>",
     0,
     ""
    ]);
  });
}

var qstr = [
  "select oid, library.cid, name, videos.vid, rid, artist, title, length from channel",
  "left join videos on currentsong = vid",
  "left join library on (channel.cid = library.cid and currentsong = library.vid)"
].join(' ');


_mysql.query(qstr, function(err, res, fields) {
  res.forEach(loadVideo);
});


function getNext(row, cb) {
  var qstr = [
    "select oid, cid, videos.vid, rid, artist, title, length from library",
    "left join videos on library.vid = videos.vid",
    "where",
          "oid > " + row.oid,
      "and cid = " + row.cid,
    "limit 1"
  ].join(' ');

  console.log(qstr);
  _mysql.query(qstr, function(err, res, fields) {
    if(res.length == 0) {
      row.oid = 0;
      getNext(row);
    } else {
      loadVideo(res[0]);
    }
  });
}

setInterval(function(){
  var 
    now = +(new Date()),
    row,
    delta = (now - _last) / 1000;

  _db.get("mt80s:request", function(err, req) {
    if(req.length) {
      req = JSON.parse(req);
      getVideo(req.ytid, function(video) {
        video.cid = req.channel;
        setVideo(video);
      });
      _db.set("mt80s:request", "");
    }
  });

  for(var channel in _state) {
    row = _state[channel]; 
    row.offset = (row.offset + delta);

    if(row.offset > row.length) {
      getNext(row);
    }

    console.log(row);
    _db.set("mt80s:play:" + row.cid, JSON.stringify(row));

  }

  _last = now;
}, 1000);
