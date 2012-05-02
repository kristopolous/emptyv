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
$data = $r->lRange('mt80s',0, -1);
foreach($data as $row) {
  $row = json_decode($row, true);
  if($row[0] > $lastid) {
    $row[1] = stripslashes($row[1]);
    $output[] = $row;
  }
}
echo json_encode($output);
?>
