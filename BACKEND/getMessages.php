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

// Get conversation_id from URL parameters
$conversation_id = $_GET['conversation_id'] ?? null;

if (!$conversation_id) {
    echo json_encode(['success' => false, 'message' => 'Conversation ID is required']);
    exit();
}

try {
    // Verify the conversation exists and belongs to the user
    $stmt = $pdo->prepare("
        SELECT c.id, c.note_id, c.title, c.started_at, n.title as note_title
        FROM chat_conversations c
        JOIN notes n ON c.note_id = n.id
        WHERE c.id = ? AND c.user_id = ?
    ");
    $stmt->execute([$conversation_id, $user_id]);
    $conversation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$conversation) {
        echo json_encode(['success' => false, 'message' => 'Conversation not found']);
        exit();
    }

    // Get all messages in the conversation
    $stmt = $pdo->prepare("
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$conversation_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'conversation' => [
            'id' => $conversation['id'],
            'note_id' => $conversation['note_id'],
            'note_title' => $conversation['note_title'],
            'title' => $conversation['title'],
            'started_at' => $conversation['started_at']
        ],
        'messages' => $messages
    ]);

} catch (PDOException $e) {
    error_log('Get messages error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load messages. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Get messages general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading messages.'
    ]);
}
?>
