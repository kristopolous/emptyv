<!doctype html>
<html><head><meta name=description content="Non-stop back-to-back music videos from the 1980s"><title>1980s MTV</title>
<style>
body{background:#000}
img{border:0}
#player-0,#player-1,#player-2{position:absolute;top:0;left:0%;width:100%;height:100%;z-index:0}
#mute{cursor:pointer;padding:5px 0 5px 10px}
#controls{position:fixed;top:0;right:0;z-index:9;opacity:0.7}
#controls > *{display:block;padding:5px}
#controls > *:hover{background:#555}
#channel{text-align:center;position:absolute;z-index:9;opacity:0.7;width:100px;top:1em;left:1em;color:#8f8;font:bold 40px "Lucida Console",Monaco,monospace;line-height:0.85em}
</style>
<!--[if IE]><link rel=stylesheet href=css/ie.css><![endif]-->
</head>
<body>
<div id=vid2></div><div id=vid1></div><div id=vid0></div>
<div id=channel>34<br>MTV</div>
<div id=controls>
<img title="Toggle Mute" onclick=mutetoggle(this) id=mute src=images/mute_off_32.png>
<a style=text-align:center target=_blank href="%20# suggest"><img src=images/mt80s_cyber.png></a>
</div>
</body>
<script>
var _gaq=(_gaq||[]).concat(['_setAccount','UA-28399789-1'],['_trackPageview']),_referenceTime=<?=microtime(true);?>,ga;
setTimeout(function() {
ga=document.createElement('script');ga.type='text/javascript';ga.async=true;
ga.src=('https:'==document.location.protocol?'https://ssl':'http://www')+'.google-analytics.com/ga.js';
var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s);
},3000);
</script>
<script src=js/all.min.js></script>
</html>
