<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once "config.php";
session_start();
if(isset($_SESSION["id"])){
    session_unset();
    session_destroy();
    echo json_encode([
        "success" => true,
        "message" => "Logout Successful"
    ]);
}else{
    echo json_encode([
        "success" => false,
        "message" => "Logout Failed"
    ]);
}
