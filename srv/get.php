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
$chat = Array();
$channel = $_GET['l'];
$uid = $_GET['u'];
if($uid == 0) {
  $output['uid'] = $uid = uniqid();
} 

$myhb = "mt80s:hb:" . $uid;

$r->set($myhb, 1);
$r->setTimeout($myhb, 200);

$stats = Array();
$stats['online'] = count($r->keys("mt80s:hb:*"));
$key = "mt80s:log:" . $channel;
$data = $r->lRange($key, 0, -1);

foreach($data as $row) {
  $row = json_decode($row, true);
  if($row[0] > $lastid) {
    if(count($row) < 4) {
      $row[1] = Markdown(htmlspecialchars(stripslashes($row[1])));
    }
    $chat[] = $row;
  }
}

$outpue['vid'] = json_decode($r->hGet("mt80s:vid", $channel));
$output['stats'] = $stats;
$output['chat'] = $chat;
echo json_encode($output);
?>
