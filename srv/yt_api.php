<?
include_once('common.php');
$q = $_GET['q'];
switch($_GET['f']) {
	case 'search':
		$q = strtolower($q);
		if(strpos($q, 'live') == false) {
			$q .= ' -live';
		}
		$q = urlencode($q));	
		$results = file_get_contents('http://m.youtube.com/results?q='.$q);

		$matches = Array();
		preg_match_all('/v=(.{11})"/', $results, $matches);
		$matches = array_unique($matches[1]);
		echo json_encode($matches);
		break;
}
?>
