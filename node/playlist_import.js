var 
  https = require('https'),
  xml2js = require('xml2js'),
  url = require('url'),
  source = 'https://gdata.youtube.com/feeds/api/users/choonupper/uploads',
  fs = require('fs');

var redis = require('redis')
  , _db = redis.createClient();

_db.select(1);
var 
  playlist = [],
  id = 0,
  title = "(no title)",
  subtitle;

function newentry(entry) {
  if (entry.title.constructor != String) {
    entry.title = entry.title['#'];
  }
  ytid = entry['media:group']['yt:videoid'];
  if (ytid == undefined) {
    switch(entry.link[0]['@'].type) {
      case 'text/html':
        ytid = entry.link[0]['@'].href.match(/v=([\w-_]*)&/)[1];
        break;
      case 'application/atom+xml':
        ytid = entry.link[0]['@'].href.split('/').pop();
        break;
    }
  }
  playlist.push({
    length: parseInt(entry['media:group']['yt:duration']['@']['seconds']),
    title: entry.title,
    ytid: ytid,
  });
}

function addEntries(xml, channel) {
  var parser = new xml2js.Parser(), ytid;
  parser.parseString(xml, function (err, result) {
    if(err) {
      console.log({
        error: err,
        action: "parsing", 
        data: xml.toString()
      });
    }
    if('title' in result) {
      title = result.title;
      if (title.constructor != String) {
        title = title['#'];
      }
      subtitle = result.subtitle;
    }
    if ("forEach" in result.entry) {
      result.entry.forEach(newentry)
    } else {
      newentry(result.entry);
    }

    next = result.link.filter(function(entry) {
      return entry['@']['rel'] == 'next';
    });

    if(next.length > 0) {
      nextUrl = next[0]['@']['href'];
      readUrl(nextUrl, channel);
    } else {
      finish(channel);
    }

    console.log({action: "reading", data: nextUrl});
   });
}
function readUrl(urlstr, channel) {
  var buffer = "";
  parsed = url.parse(urlstr);
  parsed.path = parsed.pathname + (parsed.search || "");
  https.get(parsed, function(res) {
    res.on('data', function(d) {
      buffer += d;
    });
    res.on('end', function(){
      addEntries(buffer, channel);
    });
  }).on('error', function(e) {
    console.error(e);
  });
}
function finish(channel){
  console.log("Getting " + channel);
  _db.hget("channel", channel, function(err, chan) {
    if(!chan) {
      console.log("Creating " + channel);
      _db.hset("tick", channel, [0,0].join());
      _db.hset("channel", channel, JSON.stringify({}));
    } else {
      console.log("Found " + channel);
    }
  }); 
  var split;
  var count = 0;
  playlist.forEach(function(row) {
    count++;
    if(count % 100 == 0) {
      console.log(count);
    }
    split = row.title.split('-');
    if(split.length == 1) {
      row.artist = "";
      row.title = split[0];
    } else {
      row.artist = split.shift();
      row.title = split.join('-');
    }
    row.vid = 'yt:' + row.ytid;

    _db.hset("vid", row.vid, JSON.stringify([
      row.length,   // Length of video
      0,          // Start at 0 for now 
      100,        // Full volume
      row.artist,// Put everything in the artist
      row.title, // Empty title
      ""          // Empty notes.
    ]));

    _db.lpush("pl:" + channel, row.vid);
  });  
  console.log("Finished");
}

readUrl(source, "Liquid DNB");
