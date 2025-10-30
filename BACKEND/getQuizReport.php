<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['user_id'];

if (isset($_GET['quiz_id'])) {
    // Fetch specific quiz details
    $quizId = $_GET['quiz_id'];

    // Get quiz attempt details
    $stmt = $conn->prepare("
        SELECT 
            qa.quiz_id,
            qa.attempt_date,
            qa.score,
            q.title as quiz_title,
            n.title as notes_title,
            n.id as notes_id
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN notes n ON q.notes_id = n.id
        WHERE qa.user_id = ? AND qa.id = ?
    ");

    $stmt->bind_param("ii", $userId, $quizId);
    $stmt->execute();
    $quizResult = $stmt->get_result()->fetch_assoc();

    if (!$quizResult) {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz attempt not found']);
        exit;
    }

    // Get questions and answers for this attempt
    $stmt = $conn->prepare("
        SELECT 
            q.question_text,
            q.correct_answer,
            qa.user_answer
        FROM quiz_attempt_answers qa
        JOIN quiz_questions q ON qa.question_id = q.id
        WHERE qa.attempt_id = ?
        ORDER BY q.question_order
    ");

    $stmt->bind_param("i", $quizId);
    $stmt->execute();
    $questions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $quizResult['questions'] = $questions;

    echo json_encode($quizResult);

} else {
    // Fetch quiz history list
    $stmt = $conn->prepare("
        SELECT 
            qa.id as attempt_id,
            qa.quiz_id,
            qa.attempt_date,
            qa.score,
            q.title as quiz_title,
            n.title as notes_title,
            n.id as notes_id
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN notes n ON q.notes_id = n.id
        WHERE qa.user_id = ?
        ORDER BY qa.attempt_date DESC
    ");

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $quizHistory = [];
    while ($row = $result->fetch_assoc()) {
        $quizHistory[] = $row;
    }

    echo json_encode($quizHistory);
}

$conn->close();
?>