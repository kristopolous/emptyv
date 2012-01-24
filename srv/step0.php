<?
include('common.php');

/*
 * This is an api that can be used to create mixes from a post
 * The post as the form
 *
 * q= (json encoded array of queries)
 *
 * and then responds with
 * mix/id
 */

$mixData = Array();
$qList = json_decode($_GET['q'], true);
$id = db_result("SELECT auto_increment FROM information_schema.tables WHERE table_name='mixes'", 0);

foreach($qList as $q) {
	$mixData[] = Array('q' => $q);
}

$data = mysql_real_escape_string(json_encode($mixData));
$qstr = "insert into mixes(id,data) values($id, '$data')";
mysql_query($qstr);

$_SESSION['id'] = $id;
$_SESSION['q'] = $_GET['q'];
header('Location: step1.php');
?>
