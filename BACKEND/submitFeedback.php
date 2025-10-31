<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once "config.php";


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
$message = $_POST["message"];
$rating = $_POST["rating"];

try {
    require_once "../DATABASE/queries.php";
    $res = submitFeedback($pdo,$name,$email,$message,$rating);
    $status = $res ? 'success' : 'failure';
    file_put_contents($activity_log, date('Y-m-d H:i:s') . " - Feedback submission for $email: $status\n", FILE_APPEND);
    if ($res) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Feedback submitted successfully"
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Feedback submission failed"
        ]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error submitting feedback"
    ]);
    exit;
}
