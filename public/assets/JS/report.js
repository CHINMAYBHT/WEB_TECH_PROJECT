 // Constants
const API_BASE_URL = 'http://localhost:8080/BACKEND';

// Debug function
function log(message) {
    console.log(`[REPORTS DEBUG] ${message}`);
}

// DOM Elements
const quizList = document.getElementById('quizList');
const quizDetail = document.getElementById('quizDetail');
const backToList = document.getElementById('backToList');
const quizTitle = document.getElementById('quizTitle');
const quizDate = document.getElementById('quizDate');
const quizScore = document.getElementById('quizScore');
const notesLink = document.getElementById('notesLink');
const questionsList = document.getElementById('questionsList');

// Event Listeners
document.addEventListener('DOMContentLoaded', loadQuizHistory);
backToList.addEventListener('click', showQuizList);

// Functions
async function loadQuizHistory() {
    log('Starting loadQuizHistory');

    try {
        log(`Making fetch request to: ${API_BASE_URL}/getQuizReport.php`);
        const response = await fetch(`${API_BASE_URL}/getQuizReport.php`, {
            method: 'GET',
            credentials: 'include', // Important for sessions
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        log(`Response status: ${response.status}`);
        log(`Response ok: ${response.ok}`);

        const contentType = response.headers.get('content-type');
        log(`Response content-type: ${contentType}`);

        const rawResponse = await response.text();
        log(`Raw response: ${rawResponse.substring(0, 200)}...`);

        let quizHistory;
        if (contentType && contentType.includes('application/json')) {
            try {
                quizHistory = JSON.parse(rawResponse);
                log(`Parsed JSON successfully, type: ${Array.isArray(quizHistory) ? 'Array' : typeof quizHistory}`);
                log(`Data length: ${Array.isArray(quizHistory) ? quizHistory.length : 'N/A'}`);
            } catch (jsonError) {
                log(`JSON parsing failed: ${jsonError.message}`);
                throw new Error('Invalid JSON response from server');
            }
        } else {
            log('Response was not JSON');
            throw new Error('Server did not return JSON');
        }

        if (response.ok) {
            log('Response was OK, displaying quiz history');
            displayQuizHistory(quizHistory);
        } else {
            log(`Response not OK, error: ${quizHistory.error || 'Unknown error'}`);
            throw new Error(quizHistory.error || 'Failed to load quiz history');
        }
    } catch (error) {
        log(`Error in loadQuizHistory: ${error.message}`);
        showError(`Failed to load quiz history: ${error.message}`);
    }
}

function displayQuizHistory(quizHistory) {
    if (quizHistory.length === 0) {
        quizList.innerHTML = '<div class="no-data">No quiz attempts found. Take a quiz to see your results here!</div>';
        return;
    }

    quizList.innerHTML = `
        <table class="quiz-table">
            <thead>
                <tr>
                    <th>Quiz Title</th>
                    <th>Notes</th>
                    <th>Date Taken</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${quizHistory.map(quiz => `
                    <tr onclick="loadQuizDetails(${quiz.attempt_id})">
                        <td class="quiz-title-cell">${quiz.quiz_title}</td>
                        <td>${quiz.notes_title}</td>
                        <td>${formatDate(quiz.attempt_date)}</td>
                        <td class="score-cell">${quiz.score}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadQuizDetails(attemptId) {
    log(`Loading quiz details for attempt ID: ${attemptId}`);

    try {
        log(`Making request to: ${API_BASE_URL}/getQuizReport.php?quiz_id=${attemptId}`);
        const response = await fetch(`${API_BASE_URL}/getQuizReport.php?quiz_id=${attemptId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        log(`Response status: ${response.status}`);
        log(`Response ok: ${response.ok}`);

        const contentType = response.headers.get('content-type');
        const rawResponse = await response.text();

        log(`Raw response: ${rawResponse.substring(0, 300)}...`);

        if (contentType && contentType.includes('application/json')) {
            const quizDetails = JSON.parse(rawResponse);
            log(`Parsed quiz details successfully`);

            if (response.ok) {
                displayQuizDetails(quizDetails);
            } else {
                log(`Response not OK: ${quizDetails.message || 'Unknown error'}`);
                throw new Error(quizDetails.message || 'Failed to load quiz details');
            }
        } else {
            log('Response was not JSON');
            throw new Error('Server did not return JSON');
        }
    } catch (error) {
        log(`Error in loadQuizDetails: ${error.message}`);
        showError(`Failed to load quiz details: ${error.message}`);
    }
}

function displayQuizDetails(quiz) {
    // Update quiz metadata
    quizTitle.textContent = quiz.quiz_title;
    quizDate.textContent = formatDate(quiz.attempt_date);
    quizScore.textContent = `Score: ${quiz.score}%`;
    quizScore.className = `score ${getScoreClass(quiz.score)}`;
    
    // Set up notes link
    notesLink.textContent = quiz.notes_title;
    notesLink.href = `viewNotes.html?id=${quiz.notes_id}`;
    
    // Display questions and answers
    questionsList.innerHTML = quiz.questions.map((question, index) => `
        <div class="question-item">
            <div class="question-text">Question ${index + 1}: ${question.question_text}</div>
            <div class="answer-option ${getAnswerClass(question.user_answer, question.correct_answer)}">
                Your Answer: ${question.user_answer}
                ${question.user_answer !== question.correct_answer ? 
                    `<div class="correct-answer">Correct Answer: ${question.correct_answer}</div>` : 
                    ''}
            </div>
        </div>
    `).join('');
    
    // Show quiz detail view
    showQuizDetail();
}

function showQuizDetail() {
    quizList.parentElement.style.display = 'none';
    quizDetail.style.display = 'block';
}

function showQuizList() {
    quizList.parentElement.style.display = 'block';
    quizDetail.style.display = 'none';
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

function getAnswerClass(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) return 'correct';
    return 'incorrect';
}

function showError(message) {
    quizList.innerHTML = `<div class="error">${message}</div>`;
}
