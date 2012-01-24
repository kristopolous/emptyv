<?
include('common.php');

$qList = json_decode($_SESSION['q']);
$id = $_SESSION['id'];

$mixData = Array();
foreach($qList as $q) {
	$mixData[] = yt_search($q);
}

$data = mysql_real_escape_string(json_encode($mixData));
$qstr = 'update mixes set data="'.$data.'" where id='.$id;
mysql_query($qstr);

echo "window.location='step2.php'";
