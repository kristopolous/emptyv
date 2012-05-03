<?
include("globals.php");
include("../deps/markdown.php");

function redisLink() {
  static $r = false;

  if ($r) return $r;
  $r = new Redis();
  $r->connect('localhost');
  return $r;
}

$r = redisLink();

if(empty($_GET['lastid'])) {
  $lastid = 0;
} else {
  $lastid = intval($_GET['lastid']);
}

$output = Array();
$language = $_GET['lang'];
$version = $_GET['v'];
if(intval($version) != $VERSION) {
  echo json_encode(Array(Array($lastid + 1, "<script>window.location.reload()</script>")));
  exit(0);
}

$key = "mt80s:" . $language;
$data = $r->lRange($key, 0, -1);

foreach($data as $row) {
  $row = json_decode($row, true);
  if($row[0] > $lastid) {
    $row[1] = Markdown(htmlspecialchars(stripslashes($row[1])));
    $output[] = $row;
  }
}
echo json_encode($output);
?>
