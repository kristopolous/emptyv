<?
include("common.php");

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

if(intval($version) != $VERSION) {
  return;
}

function api_chat($hash) {
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
}
?>
