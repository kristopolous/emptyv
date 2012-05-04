<?
include("common.php");
include("../deps/markdown.php");

$version = intval($_GET['v']);
if($version != $VERSION) {
  if($version < 20) {
    echo json_encode(Array(Array($lastid + 1, "<script>window.location.reload()</script>")));
  }
  echo json_encode(Array( "code" => "window.location.reload()"));
  exit(0);
}

$r = redisLink();
if(empty($_GET['id'])) {
  $lastid = 0;
} else {
  $lastid = intval($_GET['id']);
}

$output = Array();
$language = $_GET['l'];

$myhb = "mt80s:hb:" . session_id();

$r->set($myhb, 1);
$r->setTimeout($myhb, 15);

$stats = Array();
$stats['online'] = count($r->keys("mt80s:hb:*"));
$key = "mt80s:" . $language;
$data = $r->lRange($key, 0, -1);

foreach($data as $row) {
  $row = json_decode($row, true);
  if($row[0] > $lastid) {
    $row[1] = Markdown(htmlspecialchars(stripslashes($row[1])));
    $output[] = $row;
  }
}

echo json_encode(Array(
  "stats" => $stats,
  "chat" => $output
));
?>
