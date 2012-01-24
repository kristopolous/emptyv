<?
include('common.php');
$id = intval($_GET['v']);
$mix = db_result('select * from mixes where id='.$id);

$id = $mix[0];
$ttl = $mix[1];
?>
<!doctype html><link rel=stylesheet href=s.css><script src=/q.js></script><script src=/mix.js></script><script>D=<?=$mix[2]?></script>
