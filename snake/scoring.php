<?php

define('_IN_JOHNCMS', 1);
$textl='Rainbow Snake - Таблица рекородов';
require($_SERVER['DOCUMENT_ROOT'].'/incfiles/core.php');
require($_SERVER['DOCUMENT_ROOT'].'/incfiles/head.php');


$score = (int)$_POST['score'];
if ($login == '') {
	mysql_query("INSERT INTO `snake` SET
	`name` = 'Гость',
	`score` = '$score'
	");
} else {

/*
---------------------------------------------
Отправляем имя юзера и его очки в базу данных
---------------------------------------------
*/
mysql_query("INSERT INTO `snake` SET
	`name` = '$login',
	`score` = '$score'
	");
}
//удаляем нулевые рекорды
mysql_query("DELETE FROM `snake` WHERE `score` <1");
//удаляем больое 400
mysql_query("DELETE FROM `snake` WHERE `score` >400");

echo '<img src="goaway.jpg">';

require($_SERVER['DOCUMENT_ROOT'].'/incfiles/end.php');
?>