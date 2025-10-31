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

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Include database connection
require_once 'config.php';

// Get user session
session_start();

// Check if user is logged in
if (!isset($_SESSION['id'])) {
    // Debug: show session info
    error_log('Session debug: No user ID found in session');
    error_log('Session data: ' . json_encode($_SESSION));
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit();
}

$user_id = $_SESSION['id'];
error_log("getQuizReport: User authenticated with ID: {$user_id}");

try {
    // Check if quiz_id parameter is provided (means get detailed quiz report)
    if (isset($_GET['quiz_id'])) {
        $attempt_id = $_GET['quiz_id'];
        error_log("getQuizReport: Fetching details for attempt_id: {$attempt_id}");

        // Get quiz attempt details
        $stmt = $pdo->prepare("
            SELECT
                qa.*,
                q.title as quiz_title,
                q.questions as quiz_questions,
                n.title as notes_title,
                n.id as notes_id
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN notes n ON q.note_id = n.id
            WHERE qa.id = ? AND qa.user_id = ?
        ");

        $stmt->execute([$attempt_id, $user_id]);
        $attempt = $stmt->fetch(PDO::FETCH_ASSOC);

        error_log("getQuizReport: Query result for attempt_id {$attempt_id}: " . ($attempt ? 'Found' : 'Not found'));

        if (!$attempt) {
            echo json_encode(['success' => false, 'message' => 'Quiz attempt not found']);
            exit();
        }

        // Parse quiz questions
        $quiz_questions = json_decode($attempt['quiz_questions'], true);
        $user_answers = json_decode($attempt['answers'], true);

        // Build detailed question data
        $questions = [];
        foreach ($quiz_questions as $index => $question) {
            $user_answer_index = isset($user_answers[$index]) ? $user_answers[$index] : null;
            $user_answer = $user_answer_index !== null ? $question['options'][$user_answer_index] : 'Not answered';
            $correct_answer = $question['options'][ord($question['correct']) - ord('A')];

            $questions[] = [
                'question_text' => $question['question'],
                'user_answer' => $user_answer,
                'correct_answer' => $correct_answer,
                'is_correct' => $user_answer === $correct_answer
            ];
        }

        // Return detailed quiz attempt
        echo json_encode([
            'success' => true,
            'attempt_id' => $attempt['id'],
            'quiz_title' => $attempt['quiz_title'],
            'attempt_date' => $attempt['completed_at'],
            'score' => round(($attempt['score'] / $attempt['total_questions']) * 100),
            'notes_title' => $attempt['notes_title'],
            'notes_id' => $attempt['notes_id'],
            'questions' => $questions
        ]);

    } else {
        // Get all quiz attempts for the user
        $stmt = $pdo->prepare("
            SELECT
                qa.id as attempt_id,
                qa.completed_at as attempt_date,
                qa.score,
                qa.total_questions,
                q.title as quiz_title,
                n.title as notes_title,
                n.id as notes_id
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN notes n ON q.note_id = n.id
            WHERE qa.user_id = ?
            ORDER BY qa.completed_at DESC
        ");

        $stmt->execute([$user_id]);
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format the data as expected by frontend
        $quizHistory = array_map(function($attempt) {
            return [
                'attempt_id' => $attempt['attempt_id'],
                'quiz_title' => $attempt['quiz_title'] ?: 'Quiz',
                'attempt_date' => $attempt['attempt_date'],
                'score' => round(($attempt['score'] / $attempt['total_questions']) * 100),
                'notes_title' => $attempt['notes_title'] ?: 'Untitled Notes',
                'notes_id' => $attempt['notes_id']
            ];
        }, $attempts);

        error_log("Returning quiz history: " . json_encode($quizHistory));
        echo json_encode($quizHistory);
    }

} catch (PDOException $e) {
    error_log('Get quiz report error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to get quiz report. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Get quiz report general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while getting the quiz report.'
    ]);
}
?>
