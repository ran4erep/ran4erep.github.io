<?php
header("Access-Control-Allow-Origin: *");

$code = $_POST['code'];
$randomKey = $_POST['randomKey'];
$codeName = $_POST['codeName'];

if ($code && $randomKey && codeName) {
if ($codeName == '') {
    $codeName = 'with_no_name_';
}
if ( preg_match('/^[\sa-z0-9_]+$/i ', $codeName) ) {
$fp = fopen('code_' . $codeName . '_' . $randomKey . '.html', 'w');
fwrite($fp, $code); // Запись в файл
fclose($fp); //Закрытие файла
}
}
?>
