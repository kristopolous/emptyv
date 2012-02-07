var
BAD = 1,      // Not entertaining
EMBED = 2,    // Not embeddable
POOR = 3,     // Wrong video, bad quality, bad audio
WRONG = 4,    // Inappropriate (too late, wrong style)
MISSING = 5,  // Not found
_words = {
  1: "unspecified",
  2: "license restriction",
  3: "poor quality video",
  4: "inappropriate",
  5: "no video(s) available"
},
_bad = [
["yt:Xbt30UnzRWw", 1981, "Devo", "Whip it", EMBED],
["yt:I5hnCb-93WY", 1980, "The Undertones", "My Perfect Cousin", EMBED],
["yt:qHYOXyy1ToI", 1980, "Joy Division", "Love Will Tear Us Apart", EMBED],
["yt:826PTEuHKhE", 1986, "Tiffany", "I Think We're Alone Now", EMBED],
["yt:nmoHQ2DC3zo", 1984, "General Public", "Tenderness", EMBED],
["yt:mWgSgj3sJgo", 1983, "The Cure", "Love Cats", MISSING],
["yt:gMY4W0l4peY", 1986, "The Smiths", "Ask", MISSING],
["yt:lAD6Obi7Cag", 1985, "Dire Straits", "Money For Nothing", EMBED],
["yt:xNnAvTTaJjM", 1983, "Talking Heads", "Burning Down The House", EMBED],
["yt:ZW_xuSSTOBA", 1984, "Romeo Void", "A Girl in Trouble", BAD],
["yt:YbkCyFEFa78", 1984, "The Human League", "The Lebanon", BAD],
["yt:-VCqAjYO3NM", 1986, "Pet Shop Boys", "Suburbia", BAD],
["yt:XfNLORw7r_M", 1981, "DAF", "Der Rauber und der Prinz", BAD],
["yt:I-9NEFalsjE", 1977, "Peter Gabriel", "Solsbury Hill", EMBED],
["yt:lAZgLcK5LzI", 1985, "Bangles", "Manic Monday", MISSING],
["yt:_U5HpeA_WSo", 1984, "The Smiths", "How Soon is Now?", EMBED],
["yt:0974cze7e_A", 1979, "Baccara", "Body Talk clean", BAD],
["yt:eabefjsJsAQ", 1983, "Re-Flex", "The Politics Of Dancing", EMBED], 
["yt:YfpRm-p7qlY", 1982, "The Jam", "Town Called Malice", BAD],
["", 1988, "Metallica", "Enter Sandman", EMBED],
["", 1989, "Metallica", "One", EMBED],
["yt:x8Y14hSAsa4", 1982, "Renee", "High Time He went", BAD],
["yt:tfrKejzTdLU", 1982, "Divinyls", "Science Fiction", BAD],
["", 1985, "Kate Bush", "This Woman's Work", BAD],
["yt:8tI1_KlO6xI", 1982, "Culture Club", "Time (Clock Of The Heart)", BAD],
["yt:2sCkVe31fwo", 1988, "Taste of sugar", "HMM", POOR],
["yt:6pKPNnk-JhE", 1983, "Midnight Oil", "Power And The Passion", BAD],
["yt:DhX6DniAwGg", 1985, "Duran Duran", "White Lines", BAD],
["yt:KRb7Atx6afA", 1984, "Babys Gang", "Challenger", POOR],
["yt:Ldyx3KHOFXw", 1979, "Gary Numan", "Cars", EMBED],
["", 1980, "Haircut 100", "Love Plus One", BAD],
["yt:Q_30vrkg8Xo", 1983, "Jacksons", "Can You Feel It", POOR], 
["yt:TDzkAmwCo6Y", 1989, "Gloria Estefan", "Dr. Beat", WRONG],
["yt:TMZi25Pq3T8", 1986, "N.W.A.", "Straight Outta Compton", WRONG],
["yt:bIr0yrKeR40", 1982, "Bizzy & Co", "Take a Chance", POOR], 
["yt:eSMeUPFjQHc", 1994, "Erasure", "Always", WRONG],
["", "(all)", "Prince", "(all)", MISSING],
["", "(all)", "Dire Straits", "(all)", MISSING],
["", "(all)", "The Cure", "(all)", EMBED],
["yt:g0XLKcMoXRE", 1988, "Van Halen", "Hot for Teacher", MISSING],
["yt:", 1976, "Rod Stewart", "Do Ya Think I'm Sexy?", EMBED],
["yt:vmOf3npKf9I", 1980, "Sparks", "Funny Face", BAD]
];
//["dm:x1zonp", 182, 0, 0, 100, 1983, "The Cure", "Pictures Of You", "clean"],
//["yt:3i0DMbCKnAg", 397, 0, 0, 100, "Eric Burdon & War", "Spill The Wine", "clean"],
//["yt:Ey9tJUxMk8Q", 243, 0, 0, 100, 1986, "V. Spy V. Spy", "Don't Tear It Down", "clean", BAD],
//["yt:Lr0xJBsVbZY", 256, 0, 0, 100, 1984, "Jennifer Rush", "The Power of Love", "clean"]
//yt:O8PyqxPLUeA", 213, 0, 0, 100, 1983, "The Psychedelic Furs", "Love My Way", "clean ytad"],
