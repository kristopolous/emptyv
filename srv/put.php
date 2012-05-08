<?
include("common.php");
if(intval($_GET['v']) != $VERSION) {
  return;
}

function add($key, $data) {
  global $r;

  $r->rPush($key, json_encode($data));
  while($r->lLen($key) > 15) {
    $r->lPop($key);
  }
}

$r = redisLink();

// This is an extreme action, banning people by ips.
// Great power, great responsibility.
if($r->sIsMember("mt80s:banned", $_SERVER['HTTP_X_REAL_IP'])) {
  echo json_encode(Array("banned"));
  exit(0);
}

function api_play($hash) {
  global $r;
  $channel = $hash['l'];
  $id = $r->incr("mt80s:ix");

  add(
    "mt80s:log:" . $channel,
    Array($id, $hash['id'], 0, "play")
  );
}

function api_chat($hash) {
  global $r;

  $data = $hash['d'];
  $color = $hash['c'];
  $channel = $hash['l'];
  $version = $hash['v'];

  if(strlen($data) > 0) {
    if(strlen($data) > 200) {
      $data = substr($data, 0, 200) . '...';
    }

    $id = $r->incr("mt80s:ix");

    add(
      "mt80s:log:" . $channel,
      Array($id, $data, $color)
    );

    if($channel != "all" ){
      add(
        "mt80s:log:all",
        Array($id, "$channel: " . $data, $color)
      );
    }
  }
}

if(function_exists("api_" . $_GET['f'])) {
  $toRun = "api_" . $_GET['f'];

  $result = $toRun ($_GET);
  if(is_string($result)) {
    result(false, $result);
  } else {
    result(true, $result);
  }
} else {
  result(false, "no function");
}
?>
