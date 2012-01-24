<?
include('common.php');
if(isset($_GET['v'])) {
	$id = $_GET['v'];
} else {
	$id = $_SESSION['id'];
}
$mix = db_result('select * from mixes where id='.$id);
?>
<!doctype html><link rel=stylesheet href=s.css><script src=q.js></script><script src=mix.js></script><script src=step2.js></script><script>D=<?=$mix[2]?></script>
