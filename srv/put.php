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
  $language = $hash['l'];
  $id = $r->incr("mt80s:ix");

  add(
    "mt80s:" . $language,
    Array($id, $hash['id'], 0, "play")
  );
}

function api_chat($hash) {
  global $r;

  $data = $hash['d'];
  $color = $hash['c'];
  $language = $hash['l'];
  $version = $hash['v'];

  if(strlen($data) > 0) {
    if(strlen($data) > 200) {
      $data = substr($data, 0, 200) . '...';
    }

    $id = $r->incr("mt80s:ix");

    add(
      "mt80s:" . $language,
      Array($id, $data, $color)
    );

    if($language != "all" ){
      add(
        "mt80s:all",
        Array($id, "$language: " . $data, $color)
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
