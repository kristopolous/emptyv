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
if($r->sIsMember("mt80s:banned", $_SERVER['HTTP_X_REAL_IP'])) {
  return json_encode(Array("banned"));
}
$data = trim($_GET['data']);
$color = $_GET['color'];
$language = $_GET['language'];
$version = $_GET['version'];
if(intval($version) != $VERSION) {
  return;
}
$key = "mt80s:" . $language;
if(strlen($data) > 0) {
  $redisdata = Array($r->incr($key . ":ix"), $data, $color);

  $r->rPush($key, json_encode($redisdata));

  if($r->lLen($key) > 20) {
    $r->lPop($key);
  }

  if($language != "all" ){
    $key = "mt80s:all";
    $data = Array($r->incr($key . ":ix"), $data, $color);

    $r->rPush($key, json_encode($data));

    if($r->lLen($key) > 20) {
      $r->lPop($key);
    }
  }
  $data = $redisdata;
}
return json_encode($data);

?>
