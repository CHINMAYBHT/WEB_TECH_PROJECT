const BaseURL = 'http://localhost:8080/'
export async function login(email, password) {
    const response = await fetch(`${BaseURL}BACKEND/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({ email, password })
    });
    return await response.json();
}

export async function createAcc(name,email,password) {
    const response = await fetch(`${BaseURL}BACKEND/createAcc.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({ name,email,password })
    });
    return await response.json();
}


export async function loginStatus() {
    const response = await fetch(`${BaseURL}BACKEND/loginStatus.php`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}


export async function logoutStatus(){
    const response = await fetch(`${BaseURL}BACKEND/logout.php`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}

export async function saveNote(noteData) {
    const response = await fetch(`${BaseURL}BACKEND/saveNote.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(noteData)
    });
    return await response.json();
}

export async function updateNote(noteId, updateData) {
    const response = await fetch(`${BaseURL}BACKEND/updateNote.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_id: noteId, ...updateData })
    });
    return await response.json();
}

export async function getNotes() {
    const response = await fetch(`${BaseURL}BACKEND/getNotes.php`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}

export async function deleteNote(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/deleteNote.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_id: noteId })
    });
    return await response.json();
}

export async function serveFile(filePath) {
    const response = await fetch(`${BaseURL}BACKEND/serveFile.php?file=${encodeURIComponent(filePath)}`, {
        credentials: 'include'
    });
    return response;
}

export async function getSummaries(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/getSummaries.php?note_id=${noteId}`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}

export async function generateSummary(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/generateSummary.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_id: noteId })
    });
    return await response.json();
}

export async function getQuizzes(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/getQuizzes.php?note_id=${noteId}`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}

export async function generateQuiz(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/generateQuiz.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_id: noteId })
    });
    return await response.json();
}

export async function startChat(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/startChat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_id: noteId })
    });
    return await response.json();
}

export async function sendMessage(conversationId, message) {
    const response = await fetch(`${BaseURL}BACKEND/sendMessage.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversation_id: conversationId, message: message })
    });
    return await response.json();
}

export async function getMessages(conversationId) {
    const response = await fetch(`${BaseURL}BACKEND/getMessages.php?conversation_id=${conversationId}`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}

export async function getRecentConversations(noteId) {
    const response = await fetch(`${BaseURL}BACKEND/getRecentConversations.php?note_id=${noteId}`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
}

export async function submitFeedback(name, email, message, rating) {
    const response = await fetch(`${BaseURL}BACKEND/submitFeedback.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name, email, message, rating })
    });
    return await response.json();
}
