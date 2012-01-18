var 
  mydb = DB()
    .insert(DB.objectify(["id", "length", "start", "end", "volume", "year", "artist", "title"], _duration));
//    .insert(DB.objectify(["ytid", "year", "artist", "title", "reason"], _bad));
//
function search(){
  var 
    rows = [],
    artist = $("#artist").val(),
    title = $("#title").val();

  if(artist.length > 0 || title.length > 0) {
    mydb.find({
      artist: mydb.like(artist),
      title: mydb.like(title),
    }).select('artist','title','id','year').sort('artist').each(function(res){
      rows.push([
        '<td>' + res[0] + '</td>',
        '<td>',
          '<a target=_blank href=http://youtube.com/watch?v=' + res[2].split(':')[1] + '>',
            res[1],
          '</a>',
        '</td>',
        '<td>' + res[3] + '</td>'
      ].join(''));
      
    });

    if(rows.length == 0) {
      $("#results").html("Nothing Found!");
    } else {
      $("#results").html( [
          '<table>',
           '<thead>',
             '<tr>',
               '<th>Artist</th>',
               '<th>Title</th>',
               '<th>Year</th>',
             '</tr>',
           '</thead>',
           '<tbody>',
             '<tr>',
                rows.join('</tr><tr>'),
             '</tr>',
           '</tbody>',
         '</table>'
       ].join(''));
    }
  } else {
    $("#results").html( 'enter a title or artist' );
  }
}

var on = {
  suggest: function(){
    $("#artist").focus();
  }
};

$(function(){
  $("#artist, #title").keyup(search);

  if(document.location.hash.length == 0) {
    document.location += "#suggest";
  } 
  var lastHash;

  setInterval(function(){
    if(document.location.hash != lastHash) {
      lastHash = document.location.hash;
      $(lastHash).addClass("sel").siblings().removeClass("sel");
      $("#header a").filter(function(){ return '#' + this.href.split('#')[1] == lastHash}).addClass("sel").siblings().removeClass("sel");
      if(lastHash.substr(1) in on) {
        on[lastHash.substr(1)]();
      }
    }
  }, 100);
});
