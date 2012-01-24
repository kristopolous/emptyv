<?
/*
	a: name,name,name - add artists
	q: name? - get artist ... substring
	t: name,name : add a track to an artist name
*/

include('redis.php');
function redisLink() {
	static $r = false;

	if ($r) return $r;
	$r = new Redis('192.168.0.181');
	$r->connect();
	return $r;
}
$r = redisLink();
if(isset($_GET['q'])) {
	$lexemeList = explode(' ', strtolower($_GET['q']));
	$matches = array();
	foreach($lexemeList as $lexeme) {
		$lexeme = substr($lexeme, 0, 5);
		$matches = array_merge($matches, $r->smembers('g:'.$lexeme));
	}
	$matches = array_slice(array_unique($matches), 0, 10);
	foreach($matches as $match) {
		$matches = stripslashes($match);
		echo '<a href="music.html?q='.str_replace(' ', '+', $match).'">'.stripslashes($match).'</a>';
	}
}

