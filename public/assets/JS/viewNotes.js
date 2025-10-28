document.addEventListener('headerLoaded', () => {
    console.log("view notes page loaded");

    // Get selected file data from sessionStorage
    const selectedFileData = sessionStorage.getItem('selectedFile');

    if (!selectedFileData) {
        // If no file selected, redirect back to upload notes page
        window.location.href = './uploadNotes.html';
        return;
    }

    const fileData = JSON.parse(selectedFileData);
    displayFileInfo(fileData);
    displayFileContent(fileData);

    // Initialize zoom functionality
    initializeZoomControls();
});

function displayFileInfo(fileData) {
    document.getElementById('fileNameInput').value = fileData.title || 'Untitled Note';
    document.getElementById('fileSize').textContent = fileData.size || 'Unknown size';
    document.getElementById('fileType').textContent = fileData.file_type || (fileData.content.includes('.pdf') ? 'PDF Document' : 'Text Document');
    document.getElementById('uploadDate').textContent = fileData.date || 'Unknown date';
}

function displayFileContent(fileData) {
    const fileContentDiv = document.getElementById('fileContent');

    if (!fileData.content || fileData.content.trim() === '') {
        // Show no content message
        fileContentDiv.innerHTML = `
            <div class="no-content">
                <i class="fas fa-file-alt"></i>
                <p>No content available to display</p>
            </div>
        `;
        return;
    }

    // Check if it's a PDF file (stored as file path)
    if (fileData.file_type === 'PDF Document' && fileData.content.startsWith('/uploads/')) {
        // Load and render PDF using PDF.js
        renderPDF(fileData.content, fileContentDiv);
    } else {
        // Display text content with formatting
        const formattedContent = formatTextContent(fileData.content);
        fileContentDiv.innerHTML = formattedContent;
    }
}

async function renderPDF(pdfPath, container) {
    try {
        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Load PDF document via CORS-enabled server endpoint
        const response = await fetch('http://localhost:8080/BACKEND/serveFile.php?file=' + encodeURIComponent(pdfPath), {
            credentials: 'include'
        });
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);

        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Set canvas size (adjust for better viewing)
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.maxWidth = '800px';
        canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        canvas.style.borderRadius = '8px';

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Clear container and create scrollable PDF viewer
        container.innerHTML = '';

        // Create scrollable container for all pages
        const pdfContainer = document.createElement('div');
        pdfContainer.style.overflowY = 'auto';
        pdfContainer.style.maxHeight = '80vh';
        pdfContainer.style.padding = '10px';
        pdfContainer.style.backgroundColor = '#f8f9fa';

        container.appendChild(pdfContainer);

        // Render all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            await renderPDFPage(pdf, pageNum, pdfContainer);
        }

    } catch (error) {
        console.error('Error rendering PDF:', error);
        container.innerHTML = `
            <div class="no-content">
                <i class="fas fa-file-pdf"></i>
                <p>Unable to load PDF</p>
                <p style="font-size: 1em; color: #6c757d;">${error.message}</p>
                <p style="font-size: 1em; color: #6c757d;">Please use the download button to view this PDF file</p>
            </div>
        `;
    }
}

function formatTextContent(content) {
    // Basic text formatting - you can enhance this as needed
    const lines = content.split('\n');
    let formattedHTML = '';

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            formattedHTML += '<br>';
        } else if (trimmedLine.startsWith('# ')) {
            // H1 heading
            formattedHTML += `<h1>${trimmedLine.substring(2)}</h1>`;
        } else if (trimmedLine.startsWith('## ')) {
            // H2 heading
            formattedHTML += `<h2>${trimmedLine.substring(3)}</h2>`;
        } else if (trimmedLine.startsWith('### ')) {
            // H3 heading
            formattedHTML += `<h3>${trimmedLine.substring(4)}</h3>`;
        } else if (trimmedLine.startsWith('- ')) {
            // Bullet point
            formattedHTML += `<ul><li>${trimmedLine.substring(2)}</li></ul>`;
        } else if (/^\d+\./.test(trimmedLine)) {
            // Numbered list
            const listItem = trimmedLine.replace(/^\d+\.\s*/, '');
            formattedHTML += `<ol><li>${listItem}</li></ol>`;
        } else {
            // Regular paragraph
            formattedHTML += `<p>${trimmedLine}</p>`;
        }
    }

    return formattedHTML;
}

function initializeZoomControls() {
    const downloadBtn = document.getElementById('downloadBtn');

    // Only handle download button
    downloadBtn.addEventListener('click', () => {
        downloadFile();
    });
}

async function downloadFile() {
    const selectedFileData = sessionStorage.getItem('selectedFile');
    if (!selectedFileData) return;

    const fileData = JSON.parse(selectedFileData);
    if (!fileData.content) return;

    try {
        if (fileData.file_type === 'PDF Document' && fileData.content.startsWith('/uploads/')) {
            // For PDF files stored on server, use CORS-enabled download
            const response = await fetch('http://localhost:8080/BACKEND/serveFile.php?file=' + encodeURIComponent(fileData.content), {
                credentials: 'include'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = fileData.title + '.pdf';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                // Clean up
                URL.revokeObjectURL(url);
            } else {
                throw new Error('Failed to download PDF');
            }
        } else {
            // For text notes, create blob download
            const blob = new Blob([fileData.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            // Create download link and trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${fileData.title}.txt`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
    }
}

// Action button functionality
function summarizeFile() {
    const selectedFileData = sessionStorage.getItem('selectedFile');
    if (selectedFileData) {
        const fileData = JSON.parse(selectedFileData);
        window.location.href = `./summary.html?note_id=${fileData.id}`;
    }
}

function generateQuiz() {
    const selectedFileData = sessionStorage.getItem('selectedFile');
    if (selectedFileData) {
        const fileData = JSON.parse(selectedFileData);
        window.location.href = `./quiz.html?note_id=${fileData.id}`;
    }
}

function chatWithAI() {
    const selectedFileData = sessionStorage.getItem('selectedFile');
    if (selectedFileData) {
        const fileData = JSON.parse(selectedFileData);
        window.location.href = `./chat.html?note_id=${fileData.id}`;
    }
}

// Attach event listeners to action buttons
document.addEventListener('headerLoaded', () => {
    document.querySelector('.summarize-btn')?.addEventListener('click', summarizeFile);
    document.querySelector('.quiz-btn')?.addEventListener('click', generateQuiz);
    document.querySelector('.chat-btn')?.addEventListener('click', chatWithAI);
    document.querySelector('.delete-btn')?.addEventListener('click', deleteFile);

    // Initialize filename editing
    initializeFilenameEditing();
});

// Delete file functionality
async function deleteFile() {
    const selectedFileData = sessionStorage.getItem('selectedFile');
    if (!selectedFileData) return;

    const fileData = JSON.parse(selectedFileData);

    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete "${fileData.title}"?`)) {
        try {
            // Delete from database if we have note_id
            if (fileData.id) {
                const response = await fetch('http://localhost:8080/BACKEND/deleteNote.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ note_id: fileData.id })
                });

                const result = await response.json();

                if (result.success) {
                    // Clear session storage and redirect
                    sessionStorage.removeItem('selectedFile');
                    alert('Note deleted successfully!');
                    goBack();
                } else {
                    alert(`Delete failed: ${result.message}`);
                }
            } else {
                alert('Unable to delete: Note ID not found');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Delete failed. Please try again.');
        }
    }
}

function goBack() {
    window.location.href = './uploadNotes.html';
}

// Render individual PDF page
async function renderPDFPage(pdf, pageNum, container, scale = 1.5) {
    try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas for this page
        const canvas = document.createElement('canvas');
        canvas.style.maxWidth = '800px';
        canvas.style.width = '100%';
        canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        canvas.style.borderRadius = '8px';
        canvas.style.marginBottom = '15px';
        canvas.style.display = 'block';
        canvas.style.marginLeft = 'auto';
        canvas.style.marginRight = 'auto';

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Add page number label
        const pageLabel = document.createElement('div');
        pageLabel.textContent = `Page ${pageNum}`;
        pageLabel.style.textAlign = 'center';
        pageLabel.style.marginBottom = '10px';
        pageLabel.style.color = '#6c757d';
        pageLabel.style.fontSize = '0.9em';

        container.appendChild(pageLabel);
        container.appendChild(canvas);

        // Render page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
    } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
    }
}

// Filename editing functionality
function initializeFilenameEditing() {
    const fileNameInput = document.getElementById('fileNameInput');
    const editBtn = document.getElementById('editFileNameBtn');

    if (!fileNameInput || !editBtn) return;

    // Edit button click handler
    editBtn.addEventListener('click', () => {
        fileNameInput.removeAttribute('readonly');
        fileNameInput.focus();
        fileNameInput.select(); // Select all text for easy editing
    });

    // Save on Enter key
    fileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveFilename();
        }
    });

    // Save on blur (when user clicks outside)
    fileNameInput.addEventListener('blur', () => {
        saveFilename();
    });
}

async function saveFilename() {
    const fileNameInput = document.getElementById('fileNameInput');
    const newTitle = fileNameInput.value.trim();

    if (!newTitle) {
        // Revert to original value if empty
        const selectedFileData = sessionStorage.getItem('selectedFile');
        if (selectedFileData) {
            const fileData = JSON.parse(selectedFileData);
            fileNameInput.value = fileData.title || 'Untitled Note';
        }
        fileNameInput.setAttribute('readonly', true);
        fileNameInput.blur();
        return;
    }

    // Update in database if we have note_id
    const selectedFileData = sessionStorage.getItem('selectedFile');
    if (selectedFileData) {
        const fileData = JSON.parse(selectedFileData);
        const oldTitle = fileData.title;

        try {
            // Update in database via API if we have note_id
            if (fileData.id) {
                const updateResponse = await fetch('http://localhost:8080/BACKEND/updateNote.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        note_id: fileData.id,
                        title: newTitle
                    })
                });

                const updateResult = await updateResponse.json();
                if (!updateResult.success) {
                    console.error('Failed to update note in database:', updateResult.message);
                    // Continue with localStorage update even if API fails
                }
            }

            // Update stored file data
            fileData.title = newTitle;
            sessionStorage.setItem('selectedFile', JSON.stringify(fileData));

            // Update in localStorage array for UI consistency
            const storedFiles = localStorage.getItem('uploadedFiles');
            if (storedFiles) {
                let filesArray = JSON.parse(storedFiles);
                const fileIndex = filesArray.findIndex(file => {
                    // Use note ID if available, otherwise use title and date
                    if (file.id && fileData.id) {
                        return file.id === fileData.id;
                    } else {
                        return file.title === oldTitle && file.date === fileData.date;
                    }
                });

                if (fileIndex !== -1) {
                    filesArray[fileIndex].title = newTitle;
                    localStorage.setItem('uploadedFiles', JSON.stringify(filesArray));
                }
            }
        } catch (error) {
            console.error('Error updating filename:', error);
            // Continue with localStorage update
        }
    }

    // Make input readonly again
    fileNameInput.setAttribute('readonly', true);
    fileNameInput.blur(); // Remove focus
}
