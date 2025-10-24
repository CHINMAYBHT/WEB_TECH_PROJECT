document.addEventListener('headerLoaded', () => {
    console.log("header loaded");
    let fileInput = document.getElementById('fileInput');
    let filename = document.querySelector('.filename');
    let browseBtn = document.querySelector('.uploadarea button');
    let uploadArea = document.querySelector('.uploadarea');

    browseBtn.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
        selectedFile=e.dataTransfer.files[0];
        showFileName(selectedFile);
    })

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    })

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        selectedFile=e.dataTransfer.files[0];
        showFileName(selectedFile);
    })

    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        let file = e.target.files[0];
        showFileName(file);
    })


    function showFileName(file) {
        if (!file) return;
        filename.innerHTML = `<p class='namesize'>${file.name} (${(file.size / 1024).toFixed(1)}KB)</p> <i class="fa-solid fa-xmark" onclick="removeFile()"></i>`;
    }

    // Make it global so that browser can access, as its called during runtime.
    window.removeFile=function(){
        fileInput.value = "";
        filename.innerHTML = "";
    }
})
