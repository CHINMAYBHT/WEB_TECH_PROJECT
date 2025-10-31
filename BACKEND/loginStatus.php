<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once "config.php";
session_start();
if(isset($_SESSION["id"])){
    echo json_encode([
        "success" => true,
        "message" => "Login Successful"
    ]);
}else{
    echo json_encode([
        "success" => false,
        "message" => "Login Failed"
    ]);
}
