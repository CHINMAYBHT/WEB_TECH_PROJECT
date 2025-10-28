import { startChat as apiStartChat, sendMessage as apiSendMessage, getMessages, getRecentConversations } from './api.js';

// Chat state
let currentConversationId = null;
let noteId = null;

// DOM elements
let chatMessages;
let chatInput;
let sendBtn;
let statusIndicator;
let typingIndicator;

document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
});

function initializeChat() {
    // Get DOM elements
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendBtn = document.getElementById('sendBtn');
    statusIndicator = document.getElementById('statusIndicator');
    typingIndicator = document.getElementById('typingIndicator');

    // Get note_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    noteId = urlParams.get('note_id');

    if (!noteId) {
        alert('No note selected for chat.');
        window.location.href = './dashboard.html';
        return;
    }

    // Set up event listeners
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageToAI();
        }
    });

    // Add input event listener for send button state
    chatInput.addEventListener('input', updateSendButton);

    // Load or create conversation
    loadOrCreateConversation();

    // Update chat info
    updateChatInfo();
}

async function loadOrCreateConversation() {
    try {
        // First, check if there's a recent conversation for this note
        const conversations = await getRecentConversation(noteId);

        if (conversations.length > 0) {
            // Load the most recent conversation
            currentConversationId = conversations[0].id;
            loadConversation(currentConversationId);
        } else {
            // Show loading state while creating first conversation
            showStatusMessage('Starting your AI chat...');
            // Auto-create first conversation for this note
            await createNewConversation();
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        showStatusMessage('Error loading chat. Please try again.');
    }
}

async function createNewConversation() {
    try {
        const baseUrl = 'http://localhost:8080/';
        const response = await fetch(`${baseUrl}BACKEND/startChat.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ note_id: noteId })
        });

        const result = await response.json();

        if (result.success) {
            currentConversationId = result.conversation.id;
            showWelcomeMessage();
        } else {
            console.error('Failed to create conversation:', result.message);
            showStatusMessage('Failed to start chat.');
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        showStatusMessage('Error starting chat.');
    }
}

async function getRecentConversation(noteId) {
    // This would need a new API endpoint to get recent conversations
    // For now, we'll create a new conversation when needed
    const baseUrl = 'http://localhost:8080/';
    const response = await fetch(`${baseUrl}BACKEND/getRecentConversations.php?note_id=${noteId}`, {
        method: 'GET',
        credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
        return result.conversations;
    } else {
        return [];
    }
}



function showWelcomeMessage() {
    if (!chatMessages) return; // Guard against null DOM elements

    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'message assistant';
    welcomeDiv.innerHTML = `
        <div class="message-content">
            Hello! I'm here to help you with questions about your uploaded content.
            You can ask me anything related to what you've uploaded.
        </div>
        <div class="message-timestamp">${new Date().toLocaleTimeString()}</div>
    `;

    chatMessages.appendChild(welcomeDiv);
    scrollToBottom();
}

async function loadConversation(conversationId) {
    try {
        const baseUrl = 'http://localhost:8080/';
        const response = await fetch(`${baseUrl}BACKEND/getMessages.php?conversation_id=${conversationId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            currentConversationId = conversationId;

            // Clear messages
            if (chatMessages) chatMessages.innerHTML = '';

            // Load messages
            result.messages.forEach(message => {
                displayMessage(message);
            });

            // Hide the generate section if it exists
            const generateSection = document.getElementById('generateQuizSection');
            if (generateSection) {
                generateSection.style.display = 'none';
            }
            const quizInfo = document.getElementById('quizInfo');
            if (quizInfo) quizInfo.style.display = 'block';
        } else {
            console.error('Failed to load conversation:', result.message);
            showStatusMessage('Failed to load conversation.');
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        showStatusMessage('Error loading conversation.');
    }
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !currentConversationId) return;

    // Clear input
    chatInput.value = '';
    updateSendButton();

    // Add user message to UI immediately
    const userMessage = {
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
    };
    displayMessage(userMessage);

    // Disable input while processing
    if (chatInput) chatInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    showTypingIndicator();

    try {
        const baseUrl = 'http://localhost:8080/';
        const response = await fetch(`${baseUrl}BACKEND/sendMessage.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                conversation_id: currentConversationId,
                message: message
            })
        });

        const result = await response.json();

        if (result.success) {
            // Display AI response
            displayMessage(result.ai_message);
        } else {
            alert('Failed to send message: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    } finally {
        // Always re-enable input and update button state
        hideTypingIndicator();
        if (chatInput) chatInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        updateSendButton();
    }
}

function displayMessage(message) {
    if (!chatMessages) return; // Guard against null DOM elements

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;

    const content = message.content;
    const timestamp = message.created_at ?
        new Date(message.created_at).toLocaleTimeString() :
        new Date().toLocaleTimeString();

    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(content)}</div>
        <div class="message-timestamp">${timestamp}</div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
    }
    scrollToBottom();
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

function updateSendButton() {
    if (!chatInput || !sendBtn) return; // Guard against null DOM elements
    const hasText = chatInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}

function showStatusMessage(message) {
    if (statusIndicator) {
        statusIndicator.textContent = message;
        setTimeout(() => {
            statusIndicator.textContent = 'Type and press Enter or click send';
        }, 3000);
    }
}

function scrollToBottom() {
    if (!chatMessages) return; // Guard against null DOM elements
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function updateChatInfo() {
    const titleElement = document.getElementById('chatTitle');
    const subtitleElement = document.getElementById('chatSubtitle');

    if (titleElement) titleElement.textContent = 'AI Chat Assistant';
    if (subtitleElement) subtitleElement.textContent = 'Ask questions about your uploaded content';
}

window.sendMessageToAI = sendMessage;
