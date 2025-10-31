<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Range');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is logged in for security
session_start();
if (!isset($_SESSION['id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

$user_id = $_SESSION['id'];

// Get file path from query parameter
$filePath = $_POST['file'] ?? $_GET['file'] ?? '';

if (!$filePath) {
    http_response_code(400);
    echo json_encode(['error' => 'No file specified']);
    exit();
}

// Security: Only allow access to /uploads/ directory
if (strpos($filePath, '/uploads/') !== 0 && strpos($filePath, 'uploads/') !== 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit();
}

// Construct full file path
$fullPath = '../' . ltrim($filePath, '/');

// Debug logging
error_log("serveFile.php Debug:");
error_log("Requested filePath: $filePath");
error_log("Constructed fullPath: $fullPath");
error_log("Real fullPath: " . realpath($fullPath));
error_log("File exists: " . (file_exists($fullPath) ? 'YES' : 'NO'));
error_log("CWD: " . getcwd());

// Security: Ensure the file exists and is in uploads directory
if (!file_exists($fullPath)) {
    error_log("File does not exist: $fullPath");
    http_response_code(404);
    echo json_encode(['error' => 'File not found - does not exist']);
    exit();
}

if (strpos(realpath($fullPath), 'uploads') === false) {
    error_log("File not in uploads directory: " . realpath($fullPath));
    http_response_code(403);
    echo json_encode(['error' => 'File not found - not in uploads directory']);
    exit();
}

error_log("File found and is valid: $fullPath");

// Get file extension
$fileExtension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

// Set appropriate content type
$contentTypes = [
    'pdf' => 'application/pdf',
    'txt' => 'text/plain',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

$contentType = $contentTypes[$fileExtension] ?? 'application/octet-stream';

header('Content-Type: ' . $contentType);
header('Content-Length: ' . filesize($fullPath));

// For PDFs, add additional headers for proper display
if ($fileExtension === 'pdf') {
    header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
    header('Cache-Control: public, max-age=3600');
}

// Handle range requests for better PDF viewing experience
$rangeHeader = $_SERVER['HTTP_RANGE'] ?? '';

if ($rangeHeader && $fileExtension === 'pdf') {
    list($unit, $range) = explode('=', $rangeHeader, 2);
    if ($unit === 'bytes') {
        list($start, $end) = explode('-', $range);

        $fileSize = filesize($fullPath);
        $start = intval($start);
        $end = intval($end) ?: ($fileSize - 1);

        if ($start > $end || $end >= $fileSize) {
            http_response_code(416);
            exit();
        }

        $contentLength = $end - $start + 1;

        header('Accept-Ranges: bytes');
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $fileSize);
        header('Content-Length: ' . $contentLength);
        http_response_code(206);

        $fp = fopen($fullPath, 'rb');
        fseek($fp, $start);
        echo fread($fp, $contentLength);
        fclose($fp);
    }
} else {
    // Output file content directly
    readfile($fullPath);
}
?>
