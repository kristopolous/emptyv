<?
function redisLink() {
  static $r = false;

  if ($r) return $r;
  $r = new Redis();
  $r->connect('localhost');
  return $r;
}

$data = trim($_GET['data']);
$color = $_GET['color'];
if(strlen($data) > 0) {
  $r = redisLink();
  $data = Array($r->incr("mt80s:ix"), $data, $color);

  $r->rPush("mt80s", json_encode($data));
  $r->lPop("mt80s");
}
return json_encoded($data);

?>
