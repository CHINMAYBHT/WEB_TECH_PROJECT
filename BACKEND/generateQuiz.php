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

error_log('Debug: user_id=' . $user_id . ', note_id=' . $note_id);

if (!$note_id) {
    echo json_encode(['success' => false, 'message' => 'Note ID is required']);
    exit();
}

try {
    // Verify the note exists and belongs to the user
    $stmt = $pdo->prepare("
        SELECT content, file_type
        FROM notes
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$note_id, $user_id]);
    $note = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$note) {
        echo json_encode(['success' => false, 'message' => 'Note not found']);
        exit();
    }

    // Call the Python quiz generator script
    $python_script = dirname(__DIR__, 1) . DIRECTORY_SEPARATOR . 'summary_generator.py';
    $command = 'py ' . escapeshellarg($python_script) . ' quiz ' . escapeshellarg($note_id) . ' ' . escapeshellarg($user_id);
    error_log('Command: ' . $command);

    // Execute the Python script and capture output
    $descriptors = [
        0 => ['pipe', 'r'], // stdin
        1 => ['pipe', 'w'], // stdout
        2 => ['pipe', 'w']  // stderr
    ];

    $process = proc_open($command, $descriptors, $pipes, dirname($python_script));

    if (!is_resource($process)) {
        $error = error_get_last();
        error_log('Failed to execute script. Error: ' . print_r($error, true));
        echo json_encode([
            'success' => false,
            'message' => 'Failed to start quiz generation process',
            'error' => $error['message'] ?? 'Unknown error'
        ]);
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

    // Log the output and errors
    if (!empty($stderr)) {
        error_log('Python script stderr: ' . $stderr);
    }

    if ($exitCode !== 0) {
        error_log('Python script exited with code: ' . $exitCode);
        echo json_encode([
            'success' => false,
            'message' => 'Quiz generation script failed',
            'error' => 'Script exited with code ' . $exitCode,
            'stderr' => $stderr
        ]);
        exit();
    }

    // Clean and parse the JSON output
    $output = trim($stdout);
    $jsonStart = strpos($output, '{');
    $jsonEnd = strrpos($output, '}');

    if ($jsonStart === false || $jsonEnd === false) {
        error_log('Could not find JSON in output: ' . $output);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid response format from quiz generation script',
            'output' => $output,
            'stderr' => $stderr
        ]);
        exit();
    }

    $jsonStr = substr($output, $jsonStart, $jsonEnd - $jsonStart + 1);

    // Try to parse the JSON
    $result = json_decode($jsonStr, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        $jsonError = json_last_error_msg();
        error_log('JSON decode error: ' . $jsonError);
        error_log('Raw output that failed to parse: ' . $output);

        echo json_encode([
            'success' => false,
            'message' => 'Failed to parse script output',
            'error' => $jsonError,
            'output' => $output,
            'stderr' => $stderr
        ]);
        exit();
    }

    // Return the result from the Python script
    if ($result['success']) {
        echo json_encode([
            'success' => true,
            'message' => 'Quiz generated successfully',
            'quiz' => $result['quiz']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => $result['message'] ?? 'Failed to generate quiz'
        ]);
    }

} catch (PDOException $e) {
    error_log('Generate quiz error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to generate quiz. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Generate quiz general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while generating the quiz.'
    ]);
}
?>
