<?

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
$language = $_GET['language'];
$key = "mt80s:" . $language;
$data = $r->lRange($key,0, -1);
foreach($data as $row) {
  $row = json_decode($row, true);
  if($row[0] > $lastid) {
    $row[1] = htmlspecialchars(stripslashes($row[1]));
    $output[] = $row;
  }
}
echo json_encode($output);
?>
