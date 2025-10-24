<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET,POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


date_default_timezone_set('Asia/Kolkata'); 

ini_set("log_errors",1); // enable error logging
ini_set("error_log",__DIR__."/../LOGS/error.log"); // set error log file
$activity_log=__DIR__."/../LOGS/activity.log";

require_once __DIR__ . '/env_loader.php';

$dbhost = getenv('DB_HOST');
$dbuser = getenv('DB_USER');
$dbpass = getenv('DB_PASS');
$dbname = getenv('DB_NAME');


$dsn="mysql:host=$dbhost;dbname=$dbname";

try{
    $pdo=new PDO($dsn,$dbuser,$dbpass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    $msg=date('Y-m-d s-i-H')."Database Connection Successful";
    file_put_contents($activity_log,$msg,FILE_APPEND);
}
catch(PDOException $e){
    error_log("Connection Failed".$e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success'=>false,
        'message'=>'Database Connection Failed'
    ]);
    exit;
}