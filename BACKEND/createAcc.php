<?php
require_once "config.php";


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
session_start(); // create session so that u can set it and use it in other pages, we normally used localstorage for this.
$activity_log=__DIR__."/../logs/activity.log";

if ($_SERVER["REQUEST_METHOD"] != "POST") { // allow only valid requests.
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Invalid Request Method"
    ]);
    exit;
}

$name = $_POST["name"];
$email = $_POST["email"];
$password = $_POST["password"];
$password=password_hash($password,PASSWORD_DEFAULT);

try {
    require_once "../DATABASE/queries.php";
    $res = createAcc($pdo,$name,$email,$password);
    $status = $res ? 'success' : 'failure';
    file_put_contents($activity_log, date('Y-m-d s:i:H') . " - Create Account attempt for $email: $status\n", FILE_APPEND);
    if ($res) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Account created successfully"
        ]);
        exit;
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Account creation failed"
        ]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal Server Error"
    ]);
    exit;
}
