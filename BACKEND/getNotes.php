<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
    // Get all notes for the user
    $stmt = $pdo->prepare("
        SELECT id, title, content, file_size, file_type, uploaded_at
        FROM notes
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
    ");

    $stmt->execute([$user_id]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format data for frontend compatibility
    $formattedNotes = [];
    foreach ($notes as $note) {
        // Determine file type based on content - handle both old and new data
        $file_type = $note['file_type'] ?: 'Text Document';
        $content = $note['content'] ?: '';

        // If file_type is not explicitly PDF but content looks like a file path, it's a PDF
        if ($file_type !== 'PDF Document' && strpos($content, '/uploads/') === 0) {
            $file_type = 'PDF Document';
        }

        $formattedNotes[] = [
            'id' => $note['id'],
            'title' => $note['title'],
            'date' => date('m/d/Y', strtotime($note['uploaded_at'])), // Format as mm/dd/yyyy
            'size' => $note['file_size'] ?: 'Unknown size',
            'content' => $content,
            'file_type' => $file_type
        ];
    }

    echo json_encode([
        'success' => true,
        'notes' => $formattedNotes
    ]);

} catch (PDOException $e) {
    error_log('Get notes error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve notes. Please try again.'
    ]);
}
?>
