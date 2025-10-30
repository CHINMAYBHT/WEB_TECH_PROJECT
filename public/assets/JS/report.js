// Constants
const API_BASE_URL = '../../BACKEND';

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
    try {
        const response = await fetch(`${API_BASE_URL}/getQuizReport.php`);
        const quizHistory = await response.json();
        
        if (response.ok) {
            displayQuizHistory(quizHistory);
        } else {
            throw new Error(quizHistory.error || 'Failed to load quiz history');
        }
    } catch (error) {
        showError('Failed to load quiz history. Please try again later.');
    }
}

function displayQuizHistory(quizHistory) {
    if (quizHistory.length === 0) {
        quizList.innerHTML = '<div class="no-data">No quiz attempts found. Take a quiz to see your results here!</div>';
        return;
    }

    quizList.innerHTML = quizHistory.map(quiz => `
        <div class="quiz-item" onclick="loadQuizDetails(${quiz.attempt_id})">
            <div class="quiz-item-info">
                <div class="quiz-item-title">${quiz.quiz_title}</div>
                <div class="quiz-item-meta">
                    <span>${formatDate(quiz.attempt_date)}</span>
                    <span>Notes: ${quiz.notes_title}</span>
                </div>
            </div>
            <div class="quiz-item-score">${quiz.score}%</div>
        </div>
    `).join('');
}

async function loadQuizDetails(attemptId) {
    try {
        const response = await fetch(`${API_BASE_URL}/getQuizReport.php?quiz_id=${attemptId}`);
        const quizDetails = await response.json();
        
        if (response.ok) {
            displayQuizDetails(quizDetails);
        } else {
            throw new Error(quizDetails.error || 'Failed to load quiz details');
        }
    } catch (error) {
        showError('Failed to load quiz details. Please try again later.');
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