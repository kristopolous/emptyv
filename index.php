<?  include_once("srv/common.php"); ?>
<!doctype html>
<html><head><meta name=description content="Non-stop back-to-back music videos from the 1980s"><title>1980s MTV</title>
<style>
body{background:#000;font-family:Verdana}
img{border:0}
#stats{color:#666;height:0;font-size:0.6em;margin-top:-0.2em;margin-left:0.3em}
#language_tab {float:right;margin-top:-0.2em;height:0}
#language_tab a{background:#222;color:#888;padding:0.05em 0.4em;margin:0 0 0 0.15em;cursor:pointer;font-size:0.75em}
#language_tab a:hover{box-shadow:0 0 2px 2px #444}
#language_tab a.selected{background:#333;color:#fff}
#players object,#players embed{position:absolute;top:0;left:0%;width:100%;height:100%;z-index:0}
#mute-control{height:132px;position:relative}
#mute-bg{position:absolute;background:#444;top:10px;height:122px;left:20px;width:10px}
#mute{cursor:pointer;position:absolute;left:10px}
#controls{display:none;position:fixed;top:0;right:0;z-index:9;opacity:0.7;width:50px}
#controls > *{display:block;padding:5px}
#channel{text-align:center;position:absolute;z-index:9;opacity:0.7;width:100px;top:1em;left:0.5em;color:#8f8;font:bold 40px "Lucida Console",Monaco,monospace;line-height:0.85em}
#description{box-shadow:0px 0px 4px 4px #333;width:190px;background:#222;padding:0.75em;font-family:Tahoma, Geneva, sans-serif;position:absolute;bottom:1.3em;left:1em;font-size:0.95em;font-weight:normal;text-align:left;color:white}
#chatbar{background:url("css/chat-bg.png");display:none;position:absolute;bottom:1em;left:0.75em}
#message{font-family:Tahoma, Geneva, sans-serif;font-size:0.95em;font-weight:normal;text-align:left;color:#ccc}
#message p,h1,h2,h3,h4,h5,h6{margin:0}
#message div{box-shadow:1px 0 1px 0 #444;width:205px;padding:0.25em 0.2em;overflow:hidden;margin:0 0.25em}
#autocomplete{display:none;width:220px;position:absolute;bottom:0em;left:220px;background:url("css/chat-bg.png");color:#ccc;padding:0 0.15em}
#autocomplete a{display:block;font-size:0.75em;
cursor: pointer;
margin:0.2em 0;
padding:0.20em 0 0.20em 0.25em;background:url("css/chat-bg.png")}
#autocomplete a:hover{background:#444;color:#fff}
#autocomplete img{height:50px;vertical-align:top}
#autocomplete span{cursor:pointer; display:inline-block;width:130px;margin-left:6px;color:#aaa;margin-top:0.25em}
#talk{display:block;box-shadow: 0 0 2px 2px #444;background:#333;color:#ccc;border-width:0;font-size:0.85em;width:202px;padding:0.15em 3px;margin-left:6px;margin-bottom:6px;}
.c a{color:#fff}
.c0,.c0 a{color:#DC92A8}
.c1,.c1 a{color:#9aa6e4}
.c2,.c2 a{color:#E0A298}
.c3,.c3 a{color:#7ac749}
.c4,.c4 a{color:#cfd58b}
.c5,.c5 a{color:#F4E557}
.c6,.c6 a{color:#b86db0}
.c7,.c7 a{color:#9cff7b}
.c8,.c8 a{color:#b3b3b9}
</style>
<!--[if IE]><link rel=stylesheet href=css/ie.css><![endif]-->
</head>
<body>
<div id=players>
<div id=p4></div><div id=p3></div>
<div id=p2></div><div id=p1></div><div id=p0></div>
</div>
<div id=controls>
  <a style=text-align:center target=_blank href="%20# suggest"><img src=images/mt80s_cyber.png></a>
  <div id=mute-control><div id=mute-bg></div><img id=mute src=images/mute_off_32.png></div>
</div>
<div id=description>
Over 570 music videos.<br>
Everyone is watching<br>
the same video,<br>
at the same time.<br>
Just like TV.<br>
<b>Here comes the chat!</b><br>
</div>
<div id=chatbar> 
  <div id=message></div>
  <input id=talk onenter=dochat maxlength=200 autocomplete=off>
  <div id=stats></div>
  <div id=language_tab></div>
  <div id=autocomplete></div>
</div>
</body>
<script>

var 
  VERSION = <?= $VERSION ?>,
  _gaq=[['_setAccount','UA-28399789-1'],['_trackPageview']],
  _referenceTime=<?=microtime(true);?>,
  ga,
  s;

(function(){
ga=document.createElement('script');
ga.type='text/javascript';
ga.async=true;
ga.src='http://www.google-analytics.com/ga.js';
s=document.getElementsByTagName('script')[0];
s.parentNode.insertBefore(ga,s);
})();

</script>
<script src=js/swfobject.js></script> 
<script src=js/evda.min.js></script> 
<script src=js/playlist.js></script> 
<script src=js/db.min.js></script>
<script src=js/mt80s.js></script> 
</html>
