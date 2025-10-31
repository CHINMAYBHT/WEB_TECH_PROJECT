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

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$quiz_id = $input['quiz_id'] ?? null;
$answers = $input['answers'] ?? null;
$score = $input['score'] ?? null;
$total_questions = $input['total_questions'] ?? null;
$time_taken = $input['time_taken'] ?? null;

if (!$quiz_id || !is_array($answers) || !isset($score) || !$total_questions) {
    echo json_encode(['success' => false, 'message' => 'Missing required data']);
    exit();
}

try {
    // Insert quiz attempt
    $stmt = $pdo->prepare("
        INSERT INTO quiz_attempts (
            quiz_id, user_id, answers, score, total_questions, time_taken
        ) VALUES (?, ?, ?, ?, ?, ?)
    ");

    $answers_json = json_encode($answers);

    $stmt->execute([
        $quiz_id,
        $user_id,
        $answers_json,
        $score,
        $total_questions,
        $time_taken
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Quiz attempt saved successfully'
    ]);

} catch (PDOException $e) {
    error_log('Save quiz attempt error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save quiz attempt. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Save quiz attempt general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while saving the quiz attempt.'
    ]);
}
?>
