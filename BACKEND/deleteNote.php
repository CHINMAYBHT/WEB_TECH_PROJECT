<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: DELETE, POST, OPTIONS');
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
    // Get POST data for note_id
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['note_id'])) {
        echo json_encode(['success' => false, 'message' => 'Note ID is required']);
        exit();
    }

    $note_id = $data['note_id'];

    // Delete note from database (user owns the note due to foreign key constraint)
    $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");

    $stmt->execute([$note_id, $user_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Note deleted successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Note not found or no permission to delete']);
    }

} catch (PDOException $e) {
    error_log('Note delete error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete note. Please try again.'
    ]);
}
?>
