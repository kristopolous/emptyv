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

  if(artist.length > 1 || title.length > 1) {
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
  } else {
    $("#results").html( 'more data needed' );
  }
}

$(function(){
  $("#artist, #title").keyup(search);
});
