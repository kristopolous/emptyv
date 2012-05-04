<?
session_start();

$VERSION = 20;

function redisLink() {
  static $r = false;

  if ($r) return $r;
  $r = new Redis();
  $r->connect('localhost');
  return $r;
}

function result($succeed, $message) {
  echo json_encode(
    Array(
      'status' => $succeed,
      'result' => $message
    )
  );
  exit(0);
}

?>
