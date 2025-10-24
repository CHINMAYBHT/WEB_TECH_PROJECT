<?php
require_once "config.php"; //check if database connection established or not.
// Handle preflight requests
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

$email = $_POST["email"];
$password = $_POST["password"];


try {
    require_once "../DATABASE/queries.php";
    $res = getUser($pdo,$email);
    $status = $res ? 'success' : 'failure';
    file_put_contents($activity_log, date('Y-m-d s:i:H') . " - Login attempt for $email: $status\n", FILE_APPEND);
    if ($res && password_verify($password,$res["password"])) {
        $_SESSION["id"] = $res["id"];
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login Successful"
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid Credentials"
        ]);
    }
} catch (PDOException $e) {
    error_log("Query failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database query failed'
    ]);
    exit;
}



