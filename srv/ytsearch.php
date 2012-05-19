<?
echo $_GET['ix']."\n";
usleep(rand(500000,2000000));

$query = preg_replace('/%u\d{4}/','', utf8_decode($_GET['q']));
$query = preg_replace('/%u\d{4}/','', urldecode($query));
$query = preg_replace('/\(.*/','', urldecode($query));
$results = file_get_contents('http://gdata.youtube.com/feeds/api/videos?alt=json&q='.urlencode($query).'&orderby=relevance&max-results=10&v=2');
$results = json_decode($results, true);
$videoList = $results['feed']['entry'];

$out = Array();
foreach($videoList as $video){
  $title = $video['title']['$t'];
  $ytid = $video['id']['$t'];
  $parts = explode(':', $ytid);
  $ytid = array_pop($parts);
  $out[] = $ytid."\t".substr($title, 0, 80);
}

if(count($out) > 0) {
  $out = html_entity_decode(join("\n", $out));
  echo $out;
}
?>
