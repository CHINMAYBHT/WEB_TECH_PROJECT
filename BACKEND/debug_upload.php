<?php
// Debug script to check file upload functionality

echo "<h1>File Upload Debug</h1>";

// Check if uploads directory exists and is writable
$uploadDir = '../uploads/';

echo "<h2>Uploads Directory Status:</h2>";
echo "<p>Directory: $uploadDir</p>";
echo "<p>Exists: " . (file_exists($uploadDir) ? 'YES' : 'NO') . "</p>";
echo "<p>Is directory: " . (is_dir($uploadDir) ? 'YES' : 'NO') . "</p>";
echo "<p>Writable: " . (is_writable($uploadDir) ? 'YES' : 'NO') . "</p>";

if (!is_dir($uploadDir)) {
    echo "<p>Creating directory...</p>";
    $result = mkdir($uploadDir, 0777, true);
    echo "<p>Create result: " . ($result ? 'SUCCESS' : 'FAILED') . "</p>";
}

// Check session
session_start();
echo "<h2>Session Status:</h2>";
echo "<p>Session ID: " . session_id() . "</p>";
echo "<p>User ID: " . (isset($_SESSION['id']) ? $_SESSION['id'] : 'NOT SET') . "</p>";

// Check if files exist
echo "<h2>Files in uploads directory:</h2>";
if (is_dir($uploadDir)) {
    $files = scandir($uploadDir);
    echo "<ul>";
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            $filePath = $uploadDir . $file;
            $fileSize = filesize($filePath);
            echo "<li>$file ($fileSize bytes)</li>";
        }
    }
    echo "</ul>";
}

echo "<h2>All Done</h2>";
?>
