<?  include_once("srv/globals.php"); ?>
<!doctype html>
<html><head><meta name=description content="Non-stop back-to-back music videos from the 1980s"><title>1980s MTV</title>
<style>
body{background:#000}
img{border:0}
#language_tab {float:right;margin-top:-0.1em}
#language_tab a{background:#222;color:#888;padding:0.05em 0.4em;font-family:Verdana;margin:0 0 0 0.15em;cursor:pointer;font-size:0.75em}
#language_tab a:hover{box-shadow:0 0 2px 2px #444}
#language_tab a.selected{background:#333;color:#fff}
#players object,#players embed{position:absolute;top:0;left:0%;width:100%;height:100%;z-index:0}
#mute{cursor:pointer;padding:5px 0 5px 10px}
#controls{position:fixed;top:0;right:0;z-index:9;opacity:0.7}
#controls > *{display:block;padding:5px}
#controls > *:hover{background:#555}
#channel{text-align:center;position:absolute;z-index:9;opacity:0.7;width:100px;top:1em;left:0.5em;color:#8f8;font:bold 40px "Lucida Console",Monaco,monospace;line-height:0.85em}
#description{box-shadow:0px 0px 4px 4px #555;background:#222;padding:0.75em;font-family:Tahoma, Geneva, sans-serif;position:absolute;bottom:1em;left:1em;font-size:0.95em;font-weight:normal;text-align:left;color:white}
#chatbar{display:none;position:absolute;bottom:0.5em;left:0.75em}
#message{font-family:Tahoma, Geneva, sans-serif;font-size:0.95em;font-weight:normal;text-align:left;color:#ccc}
#message div{background:#222;width:205px;padding:0.25em 0.4em;overflow:hidden}
#talk{
box-shadow: 0 0 2px 2px #444;
background:#333;
color:#ccc;border-width:0;border-top:1px solid #666;font-size:0.85em;width:207px;padding:0.15em 3px;margin-left:2px}
</style>
<!--[if IE]><link rel=stylesheet href=css/ie.css><![endif]-->
</head>
<body>
<div id=players>
<div id=p4></div><div id=p3></div>
<div id=p2></div><div id=p1></div><div id=p0></div>
</div>
<div id=channel>34<br>MTV</div>
<div id=controls></div>
<div id=description>
Over 500 music videos.<br>
Everyone is watching the same video,<br>
at the same time. Just like TV.<br>
<b>Have fun and please share!</b>
</div>
<div id=chatbar> 
  <div id=message></div>
  <form action=javascript:dochat() autocomplete=off>
    <input id=talk maxlength=200></input>
  </form>
  <div id=language_tab></div>
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

(function(){
ga=document.createElement('script');
ga.type='text/javascript';
ga.async=true;
ga.src='js/jquery-1.7.1.min.js';
s=document.getElementsByTagName('script')[0];
s.parentNode.insertBefore(ga,s);
})();

(function(){
ga=document.createElement('script');
ga.type='text/javascript';
ga.async=true;
ga.src='js/underscore-min.js';
s=document.getElementsByTagName('script')[0];
s.parentNode.insertBefore(ga,s);
})();
setTimeout(function() {
document.getElementById("controls").innerHTML=[
'<img title="Toggle Mute" onclick=mutetoggle(this) id=mute src=images/mute_off_32.png>',
'<a style=text-align:center target=_blank href="%20# suggest"><img src=images/mt80s_cyber.png></a>'
].join('');
},4000);
</script>
<script src=js/swfobject.js></script> 
<script src=js/evda.min.js></script> 
<script src=js/playlist.js></script> 
<script src=js/mt80s.js></script> 
</html>
