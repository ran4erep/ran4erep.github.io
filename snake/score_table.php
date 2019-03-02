<?
define('_IN_JOHNCMS', 1);
$headmod = 'snake_score';
$textl='Rainbow Snake - Таблица рекородов';
require($_SERVER['DOCUMENT_ROOT'].'/incfiles/core.php');
require($_SERVER['DOCUMENT_ROOT'].'/incfiles/head.php');



function true_wordform($num, $form_for_1, $form_for_2, $form_for_5){
	$num = abs($num) % 100;
	$num_x = $num % 10;
	if ($num > 10 && $num < 20)
		return $form_for_5;
	if ($num_x > 1 && $num_x < 5)
		return $form_for_2;
	if ($num_x == 1)
		return $form_for_1;
	return $form_for_5;
}


if ($login == '')
$login = 'Гость';

echo '<div class="phdr"><img src ="trophy.png"> <font size="5">Таблица рекордов <font color = "#FF0000">R</font><font color = "#FFA500">a</font><font color = "#FFFF00">i</font><font color = "#00FF00">n</font><font color = "#00BFFF">b</font><font color = "#0000FF">o</font><font color = "#9400D3">w</font> Snake</font> </div>';


//узнаём сколько всего положительных рекордов в базе
$total = mysql_result(mysql_query("SELECT COUNT(*) FROM `snake` WHERE `score` > 0"), 0);

echo '<div class="menu"><a href="/pages/snake"><button>Назад в игру</button></a></div>';

echo '<div class = "phdr">';
echo true_wordform($total, "Отображается", "Отображаются", "Отображаются") . ' ' . $total . ' ' . true_wordform($total, "рекорд", "рекорда", "рекордов");
echo '</div>';

//выводим из базы рекорды
$req = mysql_query("SELECT `name`, `score` FROM `snake` WHERE `score` > 0 ORDER BY `score` DESC");

    while($row=mysql_fetch_array($req))
{
echo '<div class = "menu">Пользователь <strong>#' . $row['name'] . '</strong> набрал ' . $row['score'] . ' ' . true_wordform($row['score'], "очко", "очка", "очков") . '</div>';
}

echo '<div class="menu"><a href="/pages/snake"><button>Назад в игру</button></a></div>';


require($_SERVER['DOCUMENT_ROOT'].'/incfiles/end.php');
?>