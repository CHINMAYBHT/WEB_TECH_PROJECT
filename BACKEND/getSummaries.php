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

// Get note_id parameter
$note_id = $_GET['note_id'] ?? null;

if (!$note_id) {
    echo json_encode(['success' => false, 'message' => 'Note ID is required']);
    exit();
}

try {
    // Get the latest summary for the note
    $stmt = $pdo->prepare("
        SELECT summary_text, ai_model, created_at
        FROM summaries
        WHERE note_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    ");

    $stmt->execute([$note_id, $user_id]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($summary) {
        echo json_encode([
            'success' => true,
            'summary' => [
                'text' => $summary['summary_text'],
                'model' => $summary['ai_model'],
                'generated_at' => $summary['created_at']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No summary found for this note'
        ]);
    }

} catch (PDOException $e) {
    error_log('Get summary error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve summary. Please try again.'
    ]);
}
?>
