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

// Get note_id from URL parameters
$note_id = $_GET['note_id'] ?? null;

if (!$note_id) {
    echo json_encode(['success' => false, 'message' => 'Note ID is required']);
    exit();
}

try {
    // Get recent conversations for this note and user
    $stmt = $pdo->prepare("
        SELECT c.id, c.title, c.started_at, c.last_activity,
               COUNT(m.id) as message_count
        FROM chat_conversations c
        LEFT JOIN chat_messages m ON c.id = m.conversation_id
        WHERE c.note_id = ? AND c.user_id = ? AND c.is_active = TRUE
        GROUP BY c.id
        ORDER BY c.last_activity DESC
        LIMIT 5
    ");
    $stmt->execute([$note_id, $user_id]);
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'conversations' => $conversations
    ]);

} catch (PDOException $e) {
    error_log('Get recent conversations error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load recent conversations. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Get recent conversations general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading conversations.'
    ]);
}
?>
