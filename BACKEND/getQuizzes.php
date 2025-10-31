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
    // Get the latest quiz for the note
    $stmt = $pdo->prepare("
        SELECT id, questions, created_at
        FROM quizzes
        WHERE note_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    ");

    $stmt->execute([$note_id, $user_id]);
    $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($quiz) {
        // Decode the questions JSON
        $questions = json_decode($quiz['questions'], true);

        echo json_encode([
            'success' => true,
            'quiz' => [
                'id' => $quiz['id'],
                'questions' => $questions,
                'created_at' => $quiz['created_at']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No quiz found for this note'
        ]);
    }

} catch (PDOException $e) {
    error_log('Get quiz error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve quiz. Please try again.'
    ]);
}
?>
