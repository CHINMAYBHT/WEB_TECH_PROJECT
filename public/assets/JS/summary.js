// Summary page functionality
import { getSummaries, generateSummary } from '../JS/api.js';

// Function to download summary as PDF
function downloadSummary() {
    const summaryContent = document.getElementById('summaryContent').innerText;
    const title = document.querySelector('.left-section h1')?.innerText || 'Content Summary';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Center the title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 30);

    // Split summary into points and format each in bold
    const summaryPoints = summaryContent.split('\n').filter(point => point.trim() !== '');

    let yPosition = 60;
    doc.setFontSize(14);

    summaryPoints.forEach((point, index) => {
        if (point.trim()) {
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${point.trim()}`, 20, yPosition);
            yPosition += 15;

            // Add new page if content exceeds page height
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 30;
            }
        }
    });

    doc.save('content-summary.pdf');
}

// Expose to global scope for inline onclick
window.downloadSummary = downloadSummary;

// Function to get URL parameter
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Function to load summary for a specific note
async function loadSummary() {
    const noteId = getUrlParameter('note_id');
    if (!noteId) {
        showErrorMessage("No note specified");
        return;
    }

    try {
        const result = await getSummaries(noteId);

        if (result.success) {
            displaySummary(result.summary);
        } else {
            // If no summary exists, show generate button
            showGenerateButton(noteId);
        }
    } catch (error) {
        console.error('Error loading summary:', error);
        showErrorMessage("Failed to load summary. Please try again.");
    }
}

// Function to generate summary for a specific note
async function handleGenerateSummary(noteId) {
    const generateBtn = document.getElementById('generateBtn');
    const summaryContent = document.getElementById('summaryContent');

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    try {
        const result = await generateSummary(noteId);

        if (result.success) {
            // Reload page to fetch the newly generated summary from DB
            window.location.reload();
        } else {
            alert('Failed to generate summary: ' + (result.message || 'Unknown error'));
            generateBtn.disabled = false;
            generateBtn.innerHTML = 'Generate New Summary';
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        alert('Failed to generate summary. Please check your connection and try again.');
        generateBtn.disabled = false;
        generateBtn.innerHTML = 'Generate New Summary';
    }
}

// Expose to global scope for inline onclick
window.handleGenerateSummary = handleGenerateSummary;

function displaySummary(summary) {
    const summaryContent = document.getElementById('summaryContent');
    const titleElement = document.querySelector('.right-section h1');

    if (!summary || !summary.text) {
        showErrorMessage('Summary text not available');
        return;
    }

    titleElement.textContent = 'Content Summary';

    // Format the summary text: **bold**, *bullet point, others as normal
    let formattedHtml = summary.text;
    let inList = false;
    let html = '';
    const lines = formattedHtml.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            html += '<br>';
            continue;
        }

        // Check for bold: **text**
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Check for bullet points: starting with *
        if (line.startsWith('*')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += '<li>' + line.substring(1).trim() + '</li>';
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<p>' + line + '</p>';
        }
    }

    if (inList) {
        html += '</ul>';
    }

    summaryContent.innerHTML = html;
}

function showErrorMessage(message) {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `<p style="color: red;">${message}</p>`;
}

function showGenerateButton(noteId) {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `
        <div id="generateContainer" style="text-align: center; padding: 50px;">
            <p>No summary available for this note yet.</p>
            <button id="generateBtn" onclick="handleGenerateSummary('${noteId}')" class="generate-btn">
                Generate Summary
            </button>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Summary page loaded');
    loadSummary();
});
