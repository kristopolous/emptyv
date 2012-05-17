<?
function redisLink() {
	static $r = false;

	if ($r) return $r;
	$r = new Redis();
	$r->connect('localhost');
	return $r;
}

$ret = null;
$r = redisLink();
$raw = file_get_contents("playlist.js");
$videoList = json_decode($raw, true);

foreach($videoList as $video) {
  $key = array_shift($video);
  $value = json_encode($video);

  echo $key;
  $ret = $r->hSet("mt80s:db", $key, $value);
  echo $ret . "\n" . $value;
}
