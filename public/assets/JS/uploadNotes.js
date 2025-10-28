document.addEventListener('headerLoaded', () => {
    console.log("header loaded");

    // Modal elements
    const modal = document.getElementById('uploadModal');
    const addFileBtn = document.getElementById('addFileBtn');
    const closeModalBtn = document.querySelector('.close-modal');

    // File upload elements in modal
    let fileInput = document.getElementById('fileInput');
    let filename = document.querySelector('.filename');
    let browseBtn = document.querySelector('.uploadarea button');
    let uploadArea = document.querySelector('.uploadarea');
    let uploadBtn = document.querySelector('.send');
    let loader = document.querySelector('.loader');
    let textinput = document.querySelector('.input textarea');
    const titleInput = document.querySelector('.title-input');

    // Main page elements
    const searchInput = document.getElementById('searchInput');
    const filesTableBody = document.getElementById('filesTableBody');
    const noFilesMessage = document.getElementById('noFilesMessage');
    const filesTable = document.getElementById('filesTable');

    let selectedFile = null;

    // Load files from database
    loadFilesFromAPI();

    // Modal functionality
    addFileBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        resetModal();
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetModal();
        }
    });

    function resetModal() {
        selectedFile = null;
        filename.innerHTML = "";
        textinput.value = "";
        titleInput.value = "Enter the Title";
        fileInput.value = "";
        uploadArea.classList.remove('dragover');
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterFiles(searchTerm);
    });

    function filterFiles(searchTerm) {
        const rows = filesTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const titleCell = row.cells[0];
            if (titleCell) {
                const title = titleCell.textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }

    // File listing functions
    async function loadFilesFromAPI() {
        try {
            const response = await fetch('http://localhost:8080/BACKEND/getNotes.php', {
                method: 'GET',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                filesData = result.notes;
                renderFiles();
            } else {
                console.error('Failed to load notes:', result.message);
                filesData = [];
                renderFiles();
            }
        } catch (error) {
            console.error('Error loading notes from API:', error);
            filesData = [];
            renderFiles();
        }
    }



    function renderFiles() {
        if (filesData.length === 0) {
            noFilesMessage.style.display = 'block';
            filesTable.style.display = 'none';
        } else {
            noFilesMessage.style.display = 'none';
            filesTable.style.display = 'table';
        }

        filesTableBody.innerHTML = '';

        filesData.forEach((file, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${file.title}</td>
                <td>${file.date}</td>
                <td>${file.size}</td>
                <td class="actions-cell">
                    <button class="action-btn-small delete-btn-table" onclick="event.stopPropagation(); deleteFile(${index})" title="Delete">
                        Delete
                    </button>
                </td>
            `;
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                viewFile(index);
            });
            filesTableBody.appendChild(row);
        });
    }

    // Action functions
    window.viewFile = function (index) {
        // Store the selected file data for the view page
        const selectedFile = filesData[index];
        sessionStorage.setItem('selectedFile', JSON.stringify(selectedFile));
        window.location.href = './viewNotes.html';
    };

    window.summarizeFile = function (index) {
        alert(`Summarizing ${filesData[index].title}`);
        // Add actual summarize functionality
    };

    window.quizFile = function (index) {
        window.location.href = './quiz.html';
        // Pass file data to quiz page
    };

    window.chatFile = function (index) {
        // Navigate to summary page or open chat interface
        alert(`Opening chat for ${filesData[index].title}`);
    };

    window.deleteFile = async function (index) {
        const fileToDelete = filesData[index];
        if (confirm(`Are you sure you want to delete "${fileToDelete.title}"?`)) {
            if (fileToDelete.id) {
                const response = await fetch('http://localhost:8080/BACKEND/deleteNote.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ note_id: fileToDelete.id })
                });

                const result = await response.json();

                if (result.success) {
                    // Reload all notes from database after deletion
                    await loadFilesFromAPI();
                    alert('Note deleted successfully!');
                } else {
                    alert(`Delete failed: ${result.message}`);
                }
            } else {
                alert('Unable to delete: Note ID not found');
            }
        }
    };

    // Make removeFile function globally available
    window.removeFile = function () {
        if (fileInput) fileInput.value = "";
        if (filename) filename.innerHTML = "";
        selectedFile = null;
    };

    // Title editing functionality
    titleInput.addEventListener('click', () => {
        titleInput.readOnly = false;
        titleInput.focus();
        titleInput.select();
    });

    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            titleInput.readOnly = true;
            titleInput.blur();
        }
    });

    titleInput.addEventListener('blur', () => {
        titleInput.readOnly = true;
    });

    function loading() {
        return new Promise((res, rej) => {
            setTimeout(() => {
                res(500);
            }, 2000);
        });
    }

    // Upload functionality in modal
    uploadBtn.addEventListener('click', async () => {
        if (!document.querySelector('.logoutBtn')) {
            alert("Please login first");
            return;
        }
        if (selectedFile == null && textinput.value == "") {
            alert("Please select a file or enter some text");
            return;
        }
        if (selectedFile != null && textinput.value != "") {
            alert("Please select only file or enter only text");
            return;
        }
        const fileTitle = titleInput.value.trim() || (selectedFile ? selectedFile.name : 'Untitled Note');

        loader.classList.add('display');

        // Prepare data based on content type
        let response;
        if (selectedFile) {
            // Handle PDF file upload
            const formData = new FormData();
            formData.append('pdf_file', selectedFile);
            formData.append('title', fileTitle);
            formData.append('original_filename', selectedFile.name);

            response = await fetch('http://localhost:8080/BACKEND/saveNote.php', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
        } else {
            // Handle text content upload
            const noteData = {
                title: fileTitle,
                content: textinput.value,
                file_size: `${textinput.value.length} chars`,
                file_type: 'Text Document'
            };

            response = await fetch('http://localhost:8080/BACKEND/saveNote.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(noteData)
            });
        }

        const result = await response.json();
        loader.classList.remove('display');

        if (result.success) {
            // Reload all notes from database to get fresh data
            await loadFilesFromAPI();

            // Close modal and reset
            modal.style.display = 'none';
            resetModal();

            alert("Note saved successfully!");
        } else {
            alert(`Upload failed: ${result.message}`);
        }
    });

    browseBtn.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 1) {
            filename.innerHTML = '<p style="color:red">Please upload only one file</p>';
            return;
        }
        selectedFile = e.dataTransfer.files[0];
        showFileName(selectedFile);
    });

    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        selectedFile = e.target.files[0];
        showFileName(selectedFile);
    });

    function showFileName(file) {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            filename.innerHTML = '<p style="color:red">Please upload a PDF file</p>';
            selectedFile = null;
            return;
        }
        filename.innerHTML = `<p class='namesize'>${file.name} (${(file.size / 1024).toFixed(1)}KB)</p> <i class="fa-solid fa-xmark" onclick="removeFile()"></i>`;
    }
});
