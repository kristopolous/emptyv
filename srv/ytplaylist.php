<?
include('redis.php');
function redisLink() {
	static $r = false;

	if ($r) return $r;
	$r = new Redis('192.168.0.181');
	$r->connect();
	return $r;
}

$ret = null;
$r = redisLink();
if(isset($_GET['id'])) {
	$playlist = $_GET['id'];
} else if(isset($_POST['ttl'])) {
	$playlist = $r->incr('global:playlistid');
	$ret = $playlist;
}
if(isset($_POST['ttl'])) {
	$r->set("pl:".$playlist, stripslashes($_POST['ttl']));
} else {
	if(isset($playlist)) {
		$ret = $r->get("pl:".$playlist);
	}
}
if(isset($ret)) {
	echo $ret;
}
?>
