var 
  mydb = DB()
    .insert(DB.objectify(["ytid", "length", "start", "end", "volume", "year", "artist", "title"], _duration))
    .insert(DB.objectify(["ytid", "year", "artist", "title", "reason"], _bad));
