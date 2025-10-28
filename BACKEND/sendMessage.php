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

// Function to extract text content from notes - now uses stored extracted content
function extractNoteContent($pdo, $noteId, $content, $fileType, $originalFilename = null) {
    if (strtoupper($fileType) === 'PDF DOCUMENT') {
        // For PDFs, try to get extracted content from database first
        try {
            $stmt = $pdo->prepare("
                SELECT extracted_text
                FROM extracted_content
                WHERE note_id = ? AND extraction_status = 'completed'
                LIMIT 1
            ");
            $stmt->execute([$noteId]);
            $extracted = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($extracted && !empty($extracted['extracted_text'])) {
                return $extracted['extracted_text'];
            }
        } catch (Exception $e) {
            error_log('Error getting extracted content: ' . $e->getMessage());
        }

        // Fallback: let the Python script handle on-demand extraction
        // Just return the file path which will signal the Python script to extract on demand
        return $content;
    } else {
        // For text notes, return as-is
        return $content;
    }
}

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
$conversation_id = $input['conversation_id'] ?? null;
$message = trim($input['message'] ?? '');

if (!$conversation_id || !$message) {
    echo json_encode(['success' => false, 'message' => 'Conversation ID and message are required']);
    exit();
}

try {
    // Verify the conversation exists and belongs to the user
    $stmt = $pdo->prepare("
        SELECT c.note_id, n.title as note_title, n.content, n.file_type, n.original_filename
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

    // Extract text content from the note
    $noteContent = extractNoteContent($pdo, $conversation['note_id'], $conversation['content'], $conversation['file_type'], $conversation['original_filename']);

    // Save the user's message
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (conversation_id, user_id, role, content)
        VALUES (?, ?, 'user', ?)
    ");
    $stmt->execute([$conversation_id, $user_id, $message]);
    $message_id = $pdo->lastInsertId();

    // Get conversation history for context
    $stmt = $pdo->prepare("
        SELECT role, content
        FROM chat_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$conversation_id]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare the context for the AI
    $context = [
        'note_title' => $conversation['note_title'],
        'note_content' => $noteContent,
        'file_type' => $conversation['file_type'],
        'conversation_history' => $history
    ];

    // Call the Python chat script
    $python_script = dirname(__DIR__, 1) . DIRECTORY_SEPARATOR . 'chat_response.py';

    // Create a temporary file for the context data
    $temp_dir = sys_get_temp_dir();
    $temp_file = $temp_dir . DIRECTORY_SEPARATOR . 'chat_context_' . uniqid() . '.json';

    try {
        $json_context = json_encode($context, JSON_UNESCAPED_UNICODE);
        file_put_contents($temp_file, $json_context);

        $command = 'python ' . escapeshellarg($python_script) . ' ' . escapeshellarg($temp_file) . ' ' . escapeshellarg($message);
        error_log('Chat command: ' . $command);
        error_log('JSON context: ' . $json_context);
    } catch (Exception $e) {
        error_log('Failed to create temp context file: ' . $e->getMessage());
        // Clean up temporary file
        if (file_exists($temp_file)) {
            unlink($temp_file);
        }
        echo json_encode(['success' => false, 'message' => 'Failed to prepare chat context']);
        exit();
    }

    // Execute the Python script and capture output
    $descriptors = [
        0 => ['pipe', 'r'], // stdin
        1 => ['pipe', 'w'], // stdout
        2 => ['pipe', 'w']  // stderr
    ];

    $process = proc_open($command, $descriptors, $pipes, dirname($python_script));

    if (!is_resource($process)) {
        error_log('Failed to execute chat script');
        echo json_encode(['success' => false, 'message' => 'Failed to process message']);
        exit();
    }

    // Read output and errors
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);

    // Close all pipes and the process
    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);

    if (!empty($stderr)) {
        error_log('Chat script stderr: ' . $stderr);
    }

    if ($exitCode !== 0) {
        error_log('Chat script exited with code: ' . $exitCode);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to generate AI response'
        ]);
        exit();
    }

    // Clean and parse the JSON response
    $output = trim($stdout);
    $jsonStart = strpos($output, '{');
    $jsonEnd = strrpos($output, '}');

    if ($jsonStart === false || $jsonEnd === false) {
        error_log('Could not find JSON in chat output: ' . $output);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid response format from AI chat'
        ]);
        exit();
    }

    $jsonStr = substr($output, $jsonStart, $jsonEnd - $jsonStart + 1);
    $response = json_decode($jsonStr, true);

    if (!isset($response['success']) || !$response['success'] || !isset($response['message'])) {
        error_log('Invalid response structure from AI chat');
        echo json_encode([
            'success' => false,
            'message' => 'Invalid AI response format'
        ]);
        exit();
    }

    $ai_message = $response['message'];

    // Save the AI's response
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (conversation_id, user_id, role, content)
        VALUES (?, ?, 'assistant', ?)
    ");
    $stmt->execute([$conversation_id, $user_id, $ai_message]);

    // Clean up temporary file
    if (file_exists($temp_file)) {
        unlink($temp_file);
    }

    echo json_encode([
        'success' => true,
        'user_message' => [
            'id' => $message_id,
            'role' => 'user',
            'content' => $message,
            'created_at' => date('Y-m-d H:i:s')
        ],
        'ai_message' => [
            'role' => 'assistant',
            'content' => $ai_message,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (PDOException $e) {
    error_log('Send message error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send message. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Send message general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing the message.'
    ]);
}
?>
