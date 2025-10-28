import { getQuizzes, generateQuiz } from './api.js';

// Quiz data - will be loaded from API
let quizData = [];
let noteId = null;
let quizLoaded = false;

// Quiz state
let currentQuestion = 0;
let userAnswers = [];
let flaggedQuestions = [];
let timeLeft = 60;
let timePerQuestion = 60;
let timerInterval;
let quizStarted = false;

// DOM elements
const quizInfo = document.getElementById('quizInfo');
const quizArea = document.getElementById('quizArea');
const resultsSection = document.getElementById('resultsSection');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const currentQ = document.getElementById('currentQ');
const totalQ = document.getElementById('totalQ');
const timeLeftDisplay = document.getElementById('timeLeft');
const progressFill = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

async function loadQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    noteId = urlParams.get('note_id');

    if (!noteId) {
        alert('No note selected. Please select a note first.');
        window.location.href = 'viewNotes.html';
        return;
    }

    // Show loading
    document.getElementById('quizLoading').style.display = 'block';

    try {
        const response = await getQuizzes(noteId);

        if (response.success && response.quiz) {
            // Quiz exists
            quizData = response.quiz.questions.map(q => ({
                question: q.question,
                options: q.options,
                correct: q.correct.charCodeAt(0) - 'A'.charCodeAt(0)
            }));
            quizLoaded = true;

            document.getElementById('quizLoading').style.display = 'none';
            document.getElementById('quizInfo').style.display = 'block';

            // Update title
            document.getElementById('quizTitle').textContent = 'AI Generated Quiz';
            document.getElementById('quizDescription').textContent = 'Test your knowledge based on uploaded content!';

        } else {
            // No quiz exists, show generate section
            document.getElementById('quizLoading').style.display = 'none';
            document.getElementById('generateQuizSection').style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

async function generateQuizForNote() {
    if (!noteId) return;

    // Show generating spinner
    document.getElementById('generateSpinner').style.display = 'block';
    document.querySelector('.generate-btn').disabled = true;

    try {
        const response = await generateQuiz(noteId);

        if (response.success && response.quiz) {
            // Hide the generate section and show success message
            document.getElementById('generateQuizSection').style.display = 'none';
            // Load the quiz
            await loadQuiz();
        } else {
            alert('Failed to generate quiz: ' + (response.message || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error generating quiz:', error);
        alert('Failed to generate quiz. Please try again.');
    } finally {
        document.getElementById('generateSpinner').style.display = 'none';
        document.querySelector('.generate-btn').disabled = false;
    }
}

// Initialize quiz
function initQuiz() {
    if (quizData.length === 0) {
        alert('No quiz data available');
        return;
    }
    totalQ.textContent = quizData.length;
    userAnswers = new Array(quizData.length).fill(null);
    flaggedQuestions = new Array(quizData.length).fill(false);
}

// Create question navigation boxes
function createQuestionBoxes() {
    const boxesContainer = document.getElementById('questionBoxes');
    boxesContainer.innerHTML = '';
    
    for (let i = 0; i < quizData.length; i++) {
        const box = document.createElement('button');
        box.className = 'question-box';
        box.textContent = i + 1;
        box.onclick = () => goToQuestion(i);
        boxesContainer.appendChild(box);
    }
}

// Go to specific question
function goToQuestion(questionIndex) {
    currentQuestion = questionIndex;
    timeLeft = timePerQuestion;
    loadQuestion();
}

// Update question boxes
function updateQuestionBoxes() {
    const boxes = document.querySelectorAll('.question-box');
    boxes.forEach((box, index) => {
        box.className = 'question-box';
        if (index === currentQuestion) {
            box.classList.add('current');
        } else if (userAnswers[index] !== null) {
            box.classList.add('answered');
        }
        if (flaggedQuestions[index]) {
            box.classList.add('flagged');
        }
    });
}

// Toggle flag
function toggleFlag() {
    flaggedQuestions[currentQuestion] = !flaggedQuestions[currentQuestion];
    const flagBtn = document.getElementById('flagBtn');
    if (flaggedQuestions[currentQuestion]) {
        flagBtn.classList.add('flagged');
    } else {
        flagBtn.classList.remove('flagged');
    }
    updateQuestionBoxes();
}

// Start quiz
function startQuiz() {
    timePerQuestion = parseInt(document.getElementById('timePerQuestion').value);
    timeLeft = timePerQuestion;
    
    quizStarted = true;
    quizInfo.style.display = 'none';
    quizArea.style.display = 'block';
    document.querySelector('.quiz-container').classList.add('full-width');
    
    initQuiz();
    createQuestionBoxes();
    loadQuestion();
    startTimer();
}

// Load current question
function loadQuestion() {
    const question = quizData[currentQuestion];
    questionText.textContent = question.question;
    currentQ.textContent = currentQuestion + 1;
    
    // Load options
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `
            <input type="radio" name="answer" value="${index}" id="option${index}">
            <span class="option-text">${option}</span>
        `;
        
        // Check if this option was previously selected
        if (userAnswers[currentQuestion] === index) {
            optionDiv.classList.add('selected');
            optionDiv.querySelector('input').checked = true;
        }
        
        optionDiv.addEventListener('click', () => selectOption(index, optionDiv));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('navPrevBtn').disabled = currentQuestion === 0;
    document.getElementById('navNextBtn').disabled = currentQuestion === quizData.length - 1;
    
    // Update next button
    const nextBtn = document.getElementById('nextBtn');
    if (currentQuestion === quizData.length - 1) {
        nextBtn.innerHTML = 'Finish Quiz <i class="fa-solid fa-check"></i>';
    } else {
        nextBtn.innerHTML = 'Next Question <i class="fa-solid fa-arrow-right"></i>';
    }
    
    // Update flag button
    const flagBtn = document.getElementById('flagBtn');
    if (flaggedQuestions[currentQuestion]) {
        flagBtn.classList.add('flagged');
    } else {
        flagBtn.classList.remove('flagged');
    }
    
    updateQuestionBoxes();
}

// Select option
function selectOption(index, optionDiv) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked option
    optionDiv.classList.add('selected');
    optionDiv.querySelector('input').checked = true;
    
    // Store answer
    userAnswers[currentQuestion] = index;
    updateQuestionBoxes();
}

// Next question
function nextQuestion() {
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        loadQuestion();
    } else {
        finishQuiz();
    }
}

// Previous question
function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

// Skip question
function skipQuestion() {
    userAnswers[currentQuestion] = null;
    nextQuestion();
}

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            finishQuiz();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update both timers
    if (timeLeftDisplay) timeLeftDisplay.textContent = timeString;
    const navTimeLeft = document.getElementById('navTimeLeft');
    if (navTimeLeft) navTimeLeft.textContent = timeString;
    
    // Change timer color based on time left
    const timerElement = document.querySelector('.timer');
    const navTimerElement = document.getElementById('navTimer');
    
    let timerClass = 'timer';
    let navTimerClass = 'nav-timer';
    
    if (timeLeft <= 10) {
        timerClass = 'timer danger';
        navTimerClass = 'nav-timer danger';
    } else if (timeLeft <= 30) {
        timerClass = 'timer warning';
        navTimerClass = 'nav-timer warning';
    }
    
    if (timerElement) timerElement.className = timerClass;
    if (navTimerElement) navTimerElement.className = navTimerClass;
}

// Finish quiz
function finishQuiz() {
    clearInterval(timerInterval);
    quizArea.style.display = 'none';
    resultsSection.style.display = 'block';
    
    calculateResults();
}

// Calculate results
function calculateResults() {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    
    userAnswers.forEach((answer, index) => {
        if (answer === null) {
            skipped++;
        } else if (answer === quizData[index].correct) {
            correct++;
        } else {
            wrong++;
        }
    });
    
    const percentage = Math.round((correct / quizData.length) * 100);
    
    // Update display
    document.getElementById('finalScore').textContent = correct;
    document.getElementById('percentage').textContent = percentage + '%';
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('wrongCount').textContent = wrong;
    document.getElementById('skippedCount').textContent = skipped;
    
    // Performance message
    const messageElement = document.getElementById('performanceMessage');
    if (correct >= 8) {
        messageElement.textContent = 'Excellent!';
        messageElement.className = 'performance-message excellent';
    } else if (correct >= 5) {
        messageElement.textContent = 'Good Try!';
        messageElement.className = 'performance-message good';
    } else {
        messageElement.textContent = 'Keep Practicing!';
        messageElement.className = 'performance-message practice';
    }
    
    // Generate detailed question review
    generateQuestionReview();
}

// Generate detailed question review
function generateQuestionReview() {
    const container = document.getElementById('questionsReviewContainer');
    container.innerHTML = '';
    
    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        const isSkipped = userAnswer === null;
        
        let statusClass = 'correct';
        if (isSkipped) statusClass = 'skipped';
        else if (!isCorrect) statusClass = 'wrong';
        
        const questionDiv = document.createElement('div');
        questionDiv.className = `question-item ${statusClass}`;
        
        let optionsHTML = '';
        question.options.forEach((option, optionIndex) => {
            let optionClass = '';
            if (optionIndex === question.correct) {
                optionClass = 'correct';
            } else if (optionIndex === userAnswer && userAnswer !== question.correct) {
                optionClass = 'user-wrong';
            } else if (isSkipped && optionIndex === question.correct) {
                optionClass = 'correct';
            }
            
            optionsHTML += `<div class="review-option ${optionClass}">${option}</div>`;
        });
        
        questionDiv.innerHTML = `
            <div class="question-number">Question ${index + 1}</div>
            <div class="question-text">${question.question}</div>
            <div class="review-options">
                ${optionsHTML}
            </div>
        `;
        
        container.appendChild(questionDiv);
    });
}

function downloadQuiz() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let correct = 0, wrong = 0, skipped = 0;
    let y = 10; // starting y position

    // Calculate scores
    userAnswers.forEach((answer, index) => {
        if (answer === null) skipped++;
        else if (answer === quizData[index].correct) correct++;
        else wrong++;
    });

    const percentage = Math.round((correct / quizData.length) * 100);
    const currentDate = new Date().toLocaleString('en-IN');

    // Title
    doc.setFontSize(20);
    doc.text('JavaScript Basics Quiz Results', 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, y);
    y += 10;

    // Summary
    doc.setFontSize(16);
    doc.text('Score Summary', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Score: ${correct}/${quizData.length} (${percentage}%)`, 20, y);
    y += 8;
    doc.text(`Correct Answers: ${correct}`, 20, y);
    y += 8;
    doc.text(`Wrong Answers: ${wrong}`, 20, y);
    y += 8;
    doc.text(`Skipped Questions: ${skipped}`, 20, y);
    y += 15;

    // Performance message
    let performance = 'Keep Practicing!';
    if (correct >= 8) performance = 'Excellent!';
    else if (correct >= 5) performance = 'Good Try!';
    doc.text(`Performance: ${performance}`, 20, y);
    y += 20;

    // Detailed results header
    doc.setFontSize(16);
    doc.text('Detailed Results', 20, y);
    y += 10;
    doc.setFontSize(11);

    quizData.forEach((question, index) => {
        if (y > 250) { // check if need new page
            doc.addPage();
            y = 20;
        }

        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        const isSkipped = userAnswer === null;
        let status = '✓ Correct';
        if (isSkipped) status = '○ Skipped';
        else if (!isCorrect) status = '✗ Wrong';

        // Question header
        doc.setFontSize(12);
        doc.text(`Question ${index + 1}: ${status}`, 20, y);
        y += 8;

        // Question text
        doc.setFontSize(10);
        const questionLines = doc.splitTextToSize(question.question, 170);
        doc.text(questionLines, 20, y);
        y += (questionLines.length * 4) + 5;

        // Your answer
        doc.text(`Your Answer: ${isSkipped ? 'Not answered' : question.options[userAnswer]}`, 20, y);
        y += 6;

        // Correct answer
        doc.text(`Correct Answer: ${question.options[question.correct]}`, 20, y);
        y += 12;
    });

    doc.save('quiz-results.pdf');
}



// Retake quiz
function retakeQuiz() {
    currentQuestion = 0;
    userAnswers = [];
    timeLeft = 300;
    quizStarted = false;
    
    // Remove full-width class to restore original width
    document.querySelector('.quiz-container').classList.remove('full-width');
    
    resultsSection.style.display = 'none';
    quizInfo.style.display = 'block';
}



// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Quiz page loaded');
    loadQuiz();
});

// Make functions global for HTML onclick
window.startQuiz = startQuiz;
window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.skipQuestion = skipQuestion;
window.toggleFlag = toggleFlag;
window.retakeQuiz = retakeQuiz;
window.downloadQuiz = downloadQuiz;
window.generateQuizForNote = generateQuizForNote;
