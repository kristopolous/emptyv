<?
include("globals.php");

function redisLink() {
  static $r = false;

  if ($r) return $r;
  $r = new Redis();
  $r->connect('localhost');
  return $r;
}

$r = redisLink();

// This is an extreme action, banning people by ips.
// Great power, great responsibility.
if($r->sIsMember("mt80s:banned", $_SERVER['HTTP_X_REAL_IP'])) {
  return json_encode(Array("banned"));
}

$data = trim($_GET['data']);
$color = $_GET['color'];
$language = $_GET['language'];
$version = $_GET['version'];

if(strlen($data) > 200) {
  $data = substr($data, 0, 200);
  $data .= '...';
}

if(intval($version) != $VERSION) {
  return;
}

function add($key, $data) {
  global $r;

  $r->rPush($key, json_encode($data));
  while($r->lLen($key) > 15) {
    $r->lPop($key);
  }
}

if(strlen($data) > 0) {
  $key = "mt80s:" . $language;
  $id = $r->incr("mt80s:ix");
  $redisdata = Array($id, $data, $color);

  add($key, json_encode($redisdata));

  if($language != "all" ){
    $key = "mt80s:all";
    $redisdata = Array($id, "$language: " . $data, $color);

    add($key, json_encode($redisdata));
  }
}

?>
