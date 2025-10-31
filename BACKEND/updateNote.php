<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
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
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid request data']);
        exit();
    }

    // For note title updates, we need note_id and new title
    if (isset($data['note_id']) && isset($data['title'])) {
        $note_id = $data['note_id'];
        $new_title = trim($data['title']);

        // Validate required fields
        if (empty($new_title)) {
            echo json_encode(['success' => false, 'message' => 'Title cannot be empty']);
            exit();
        }

        // Update note title
        $stmt = $pdo->prepare("
            UPDATE notes
            SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        ");

        $stmt->execute([$new_title, $note_id, $user_id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Note title updated successfully',
                'updated_title' => $new_title
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Note not found or no permission to update']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid update parameters']);
    }

} catch (PDOException $e) {
    error_log('Note update error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update note. Please try again.'
    ]);
}
?>
