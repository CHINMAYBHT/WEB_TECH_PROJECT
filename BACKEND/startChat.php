<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
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

// Get note_id from request body
$input = json_decode(file_get_contents('php://input'), true);
$note_id = $input['note_id'] ?? null;

if (!$note_id) {
    echo json_encode(['success' => false, 'message' => 'Note ID is required']);
    exit();
}

try {
    // Verify the note exists and belongs to the user
    $stmt = $pdo->prepare("
        SELECT title
        FROM notes
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$note_id, $user_id]);
    $note = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$note) {
        echo json_encode(['success' => false, 'message' => 'Note not found']);
        exit();
    }

    // Create a new chat conversation
    $stmt = $pdo->prepare("
        INSERT INTO chat_conversations (note_id, user_id, title)
        VALUES (?, ?, ?)
    ");

    $title = "Chat about: " . $note['title'];
    $stmt->execute([$note_id, $user_id, $title]);

    $conversation_id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'conversation' => [
            'id' => $conversation_id,
            'note_id' => $note_id,
            'user_id' => $user_id,
            'title' => $title,
            'started_at' => date('Y-m-d H:i:s'),
            'messages' => []
        ]
    ]);

} catch (PDOException $e) {
    error_log('Start chat error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to start chat. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Start chat general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while starting the chat.'
    ]);
}
?>
