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

    // Check if summary already exists
    $checkStmt = $pdo->prepare("
        SELECT id, summary_text, created_at
        FROM summaries
        WHERE note_id = ? AND user_id = ?
    ");
    $checkStmt->execute([$note_id, $user_id]);
    $existingSummary = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingSummary) {
        // Summary already exists, return it
        echo json_encode([
            'success' => true,
            'message' => 'Summary already available',
            'summary' => [
                'content' => $existingSummary['summary_text'],
                'note_id' => $note_id,
                'user_id' => $user_id,
                'ai_model' => 'gemini-2.5-flash',
                'generated_at' => $existingSummary['created_at']
            ]
        ]);
        exit();
    }

    // Generate summary generation started message and process in background
    $startMessage = 'Summary generation started. This may take 1-2 minutes. Please refresh the page to check progress.';

    echo json_encode([
        'success' => true,
        'message' => $startMessage,
        'processing' => true
    ]);

    // Force output to be sent immediately
    if (function_exists('ob_flush')) {
        ob_flush();
    }
    flush();

    // Close connection and continue processing
    ignore_user_abort(true);
    set_time_limit(0);
    session_write_close();

    // Execute the Python script asynchronously
    $python_script = dirname(__DIR__, 1) . DIRECTORY_SEPARATOR . 'summary_generator.py';
    $command = 'start /B py ' . escapeshellarg($python_script) . ' summary ' . escapeshellarg($note_id) . ' ' . escapeshellarg($user_id) . ' >nul 2>&1';
    exec($command);

    exit();

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
            'message' => 'Failed to start summary generation process',
            'error' => $error['message'] ?? 'Unknown error'
        ]);
        exit();
    }

    // Set stream blocking to false for timeout handling
    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);

    $start_time = time();
    $timeout = 120; // 2 minute timeout
    $output = '';
    $errors = '';

    // Read with timeout
    while (time() - $start_time < $timeout) {
        $read = [$pipes[1], $pipes[2]];
        $write = null;
        $except = null;

        if (stream_select($read, $write, $except, 1, 0) > 0) {
            foreach ($read as $stream) {
                if ($stream === $pipes[1]) {
                    $output .= fread($stream, 8192);
                } elseif ($stream === $pipes[2]) {
                    $errors .= fread($stream, 8192);
                }
            }
        }

        // Check if process is still running
        $status = proc_get_status($process);
        if (!$status['running']) {
            break;
        }
    }

    if (time() - $start_time >= $timeout) {
        // Timeout occurred
        proc_terminate($process);
        error_log('Timeout occurred while waiting for Python script');

        // Close pipes
        fclose($pipes[0]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);

        echo json_encode([
            'success' => false,
            'message' => 'Summary generation timed out. Please try again later.'
        ]);
        exit();
    }

    // Read any remaining output
    $output .= stream_get_contents($pipes[1]);
    $errors .= stream_get_contents($pipes[2]);

    // Close all pipes and the process
    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);
    
    // Log the output and errors
    if (!empty($errors)) {
        error_log('Python script stderr: ' . $errors);
    }

    if ($exitCode !== 0) {
        error_log('Python script exited with code: ' . $exitCode);
        echo json_encode([
            'success' => false,
            'message' => 'Summary generation script failed',
            'error' => 'Script exited with code ' . $exitCode,
            'stderr' => $errors
        ]);
        exit();
    }

    // Clean and parse the JSON output
    $output = trim($output);
    $jsonStart = strpos($output, '{');
    $jsonEnd = strrpos($output, '}');

    if ($jsonStart === false || $jsonEnd === false) {
        error_log('Could not find JSON in output: ' . $output);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid response format from summary generation script',
            'output' => $output,
            'stderr' => $errors
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
            'stderr' => $errors
        ]);
        exit();
    }

    // Return the result from the Python script
    if ($result['success']) {
        // Update the generated_at timestamp since Python returns "now"
        $result['summary']['generated_at'] = date('Y-m-d H:i:s');

        echo json_encode([
            'success' => true,
            'message' => 'Summary generated successfully',
            'summary' => $result['summary']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => $result['message'] ?? 'Failed to generate summary'
        ]);
    }

} catch (PDOException $e) {
    error_log('Generate summary error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to generate summary. Please try again.'
    ]);
} catch (Exception $e) {
    error_log('Generate summary general error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while generating the summary.'
    ]);
}
?>
