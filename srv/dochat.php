<?
function redisLink() {
  static $r = false;

  if ($r) return $r;
  $r = new Redis();
  $r->connect('localhost');
  return $r;
}

$r = redisLink();
$data = Array($r->incr("mt80s:ix"), strip_tags($_GET['data'], '<i><b><u>'));

$r->rPush("mt80s", json_encode($data));
$r->lPop("mt80s");

?>
