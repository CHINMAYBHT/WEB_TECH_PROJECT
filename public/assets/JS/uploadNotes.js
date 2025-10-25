document.addEventListener('headerLoaded', () => {
    console.log("header loaded");
    let fileInput = document.getElementById('fileInput');
    let filename = document.querySelector('.filename');
    let browseBtn = document.querySelector('.uploadarea button');
    let uploadArea = document.querySelector('.uploadarea');
    let uploadbtn=document.querySelector('.send');
    let loader=document.querySelector('.loader');
    let textinput=document.querySelector('.input textarea');

    let selectedFile=null;

    function loading(){
        return new Promise((res,rej)=>{
            setTimeout(() => {
                res(500);
            }, 2000);
        })
    }
    uploadbtn.addEventListener('click',async()=>{
        if(selectedFile==null && textinput.value==""){
            alert("Please select a file or enter some text");
            return;
        }
        if(selectedFile!=null && textinput.value!=""){
            alert("Please select only file or enter only text");
            return;
        }
        loader.classList.add('display');
        let val=await loading();
        loader.classList.remove('display');
        textinput.value="";
        setTimeout(() => {
            alert("Uploaded");
        }, 500);
    })
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
        if(e.dataTransfer.files.length>1){
            filename.innerHTML='<p style="color:red">Please upload only one file</p>';
            return;
        }
        selectedFile=e.dataTransfer.files[0];
        showFileName(selectedFile);
    })

    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        selectedFile = e.target.files[0];
        showFileName(selectedFile);
    })


    function showFileName(file) {
        if (!file) return;
        if(file.type !== 'application/pdf'){
            filename.innerHTML='<p style="color:red">Please upload a PDF file</p>';
            return;
        }
        filename.innerHTML = `<p class='namesize'>${file.name} (${(file.size / 1024).toFixed(1)}KB)</p> <i class="fa-solid fa-xmark" onclick="removeFile()"></i>`;
    }

    // Make it global so that browser can access, as its called during runtime.
    window.removeFile=function(){
        fileInput.value = "";
        filename.innerHTML = "";
        selectedFile=null;
    }
})
