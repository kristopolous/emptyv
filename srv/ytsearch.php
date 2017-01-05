<?
function yt_authkey() {
  if(file_exists('../secrets/authkey')) {
    return file_get_contents('../secrets/authkey');
  } 
  return null;
}

function dolog($str, $res = true, $path = 'sql.log') {
  // it's ok if this fails, I still want valid JSON output
  @file_put_contents(__dir__ . '/../logs/' . $path, 
    implode(' | ', [
      date('c'),
      $res ? '1' : '0',
      substr($str, 0, 200)
    ]) . "\n", FILE_APPEND);
}

function yt_query($opts = []) {
  $ep = 'search';
  if(isset($opts['ep'])) {
    $ep = $opts['ep'];
    unset($opts['ep']);
  }

  if( !($auth_key = yt_authkey()) ) {
    return false;
  }

  $opts['key'] = $auth_key;

  $params = http_build_query($opts);
  $url = "https://www.googleapis.com/youtube/v3/$ep?$params";

  $raw = file_get_contents($url);

  if ( !($res = @json_decode($raw, true)) ) {
    $res = false;
  }

  dolog($url, $res, 'curl.log');

  return $res;
}

echo $_GET['ix']."\n";

$query = preg_replace('/%u\d{4}/','', utf8_decode($_GET['q']));
$query = preg_replace('/%u\d{4}/','', urldecode($query));
$query = preg_replace('/\(.*/','', urldecode($query));
$res = yt_query([
  'part' => 'snippet',
  'q' => $query
]);
$videoList = $res['items'];

$out = [];
foreach($videoList as $video){
  $title = $video['snippet']['title'];
  $ytid = $video['id']['videoId'];
  $out[] = $ytid."\t".substr($title, 0, 80);
}

if(count($out) > 0) {
  $out = html_entity_decode(join("\n", $out));
  echo $out;
}
?>
