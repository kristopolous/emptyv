<?
session_start();
$db = mysql_connect('localhost', 'php', 'fixy2k');
mysql_select_db('mixes', $db);
date_default_timezone_set("America/Los_Angeles");

function db_result($qstr, $col = -1) {
	$res = mysql_query($qstr);
	$row = mysql_fetch_row($res);

	if($col > -1) {
		return $row[$col];
	} else {
		return $row;
	}
}

function yt_search($qIn) {
	$q = urlencode($qIn);
	$results = file_get_contents('http://m.youtube.com/results?q='.$q);

	preg_match_all('/v=(.{11})">(.*?)</', $results, $matchList, PREG_SET_ORDER);
	preg_match_all('/>([0-9]*:[0-9]*)/', $results, $timeList);
	$timeList = $timeList[1];

	$res = Array();
	foreach($matchList as $match) {
		if(strlen($match[2])) {
			$res[] = Array($match[1], $match[2], array_shift($timeList));
		}
	}
	return Array($qIn,$res);
}

function emit_flush($q) {
	echo $q;
	flush(0);
}
?>
