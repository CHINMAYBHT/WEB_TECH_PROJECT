<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once 'config.php';

// Get user session
session_start();

// Check if user is logged in
if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit();
}

$user_id = $_SESSION['id'];

try {
    // Check if this is a file upload or text content
    if (isset($_FILES['pdf_file'])) {
        // Handle PDF file upload
        $file = $_FILES['pdf_file'];

        // Debug info
        error_log("PDF Upload Debug:");
        error_log("File error: " . $file['error']);
        error_log("File type: " . $file['type']);
        error_log("File size: " . $file['size']);
        error_log("Temp name: " . $file['tmp_name']);

        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log("Upload error code: " . $file['error']);
            echo json_encode(['success' => false, 'message' => 'File upload error: ' . $file['error']]);
            exit();
        }

        // Validate file type
        if ($file['type'] !== 'application/pdf') {
            error_log("Invalid file type: " . $file['type']);
            echo json_encode(['success' => false, 'message' => 'Only PDF files are allowed']);
            exit();
        }

        // Create uploads directory if it doesn't exist
        $uploadDir = '../uploads/';
        error_log("Upload directory: " . realpath($uploadDir));

        if (!is_dir($uploadDir)) {
            error_log("Creating uploads directory");
            $mkdir_result = mkdir($uploadDir, 0777, true);
            error_log("mkdir result: " . ($mkdir_result ? 'success' : 'failed'));
        }

        if (!is_writable($uploadDir)) {
            error_log("Uploads directory not writable");
            echo json_encode(['success' => false, 'message' => 'Upload directory not writable']);
            exit();
        }

        // Generate unique filename
        $fileName = uniqid() . '.pdf';
        $filePath = $uploadDir . $fileName;
        error_log("Target file path: " . $filePath);

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            error_log("move_uploaded_file failed. Source: " . $file['tmp_name'] . ", Dest: " . $filePath);
            error_log("Source file exists: " . file_exists($file['tmp_name']));
            echo json_encode(['success' => false, 'message' => 'Failed to save file']);
            exit();
        }

        error_log("File saved successfully to: " . $filePath);

        // Get form data
        $title = trim($_POST['title'] ?? 'Untitled Note');
        $original_filename = $_POST['original_filename'] ?? $file['name'];
        $file_size = round($file['size'] / 1024, 1) . ' KB';

        // Insert note into database with file path
        $stmt = $pdo->prepare("
            INSERT INTO notes (user_id, title, content, file_size, file_type, original_filename, uploaded_at)
            VALUES (?, ?, ?, ?, 'PDF Document', ?, NOW())
        ");

        $stmt->execute([
            $user_id,
            $title,
            '/uploads/' . $fileName, // Store file path in content
            $file_size,
            $original_filename
        ]);

        $note_id = $pdo->lastInsertId();

        // Extract content from the uploaded PDF
        try {
            $python_script = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'content_extractor.py';
            $extraction_command = 'py ' . escapeshellarg($python_script) . ' extract ' . escapeshellarg($note_id) . ' 2>&1';

            error_log('Content extraction command: ' . $extraction_command);

            $extraction_output = shell_exec($extraction_command);
            $extraction_result = json_decode($extraction_output, true);

            if ($extraction_result && isset($extraction_result['success']) && $extraction_result['success']) {
                error_log('Content extraction successful for note ' . $note_id);
            } else {
                error_log('Content extraction failed for note ' . $note_id . ': ' . ($extraction_result['message'] ?? 'Unknown error'));
            }
        } catch (Exception $e) {
            error_log('Exception during content extraction: ' . $e->getMessage());
            // Don't fail the upload if extraction fails
        }

        echo json_encode([
            'success' => true,
            'message' => 'PDF uploaded successfully',
            'note_id' => $note_id,
            'note_data' => [
                'id' => $note_id,
                'title' => $title,
                'content' => '/uploads/' . $fileName,
                'file_size' => $file_size,
                'file_type' => 'PDF Document',
                'uploaded_at' => date('Y-m-d H:i:s')
            ]
        ]);

    } else {
        // Handle text content (existing logic)
        // Get POST data
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Invalid request data']);
            exit();
        }

        $title = trim($data['title'] ?? 'Untitled Note');
        $content = $data['content'] ?? '';
        $file_size = $data['file_size'] ?? '';
        $file_type = $data['file_type'] ?? 'Text Document';
        $original_filename = $data['original_filename'] ?? null;

        // Validate required fields
        if (empty($title) || empty($content)) {
            echo json_encode(['success' => false, 'message' => 'Title and content are required']);
            exit();
        }

        // Insert note into database
        $stmt = $pdo->prepare("
            INSERT INTO notes (user_id, title, content, file_size, file_type, original_filename, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $user_id,
            $title,
            $content,
            $file_size,
            $file_type,
            $original_filename
        ]);

        $note_id = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Note saved successfully',
            'note_id' => $note_id,
            'note_data' => [
                'id' => $note_id,
                'title' => $title,
                'content' => substr($content, 0, 100) . (strlen($content) > 100 ? '...' : ''),
                'file_size' => $file_size,
                'file_type' => $file_type,
                'uploaded_at' => date('Y-m-d H:i:s')
            ]
        ]);
    }

} catch (PDOException $e) {
    error_log('Note save error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save note. Please try again.'
    ]);
}
?>
