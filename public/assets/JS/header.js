async function renderHeader() {
    const response=await fetch("../Templates/header.html");
    const html=await response.text();
    document.querySelector(".header").innerHTML=html;
 
    //  Dispatch event to tell other scripts the header is ready
    document.dispatchEvent(new Event("headerLoaded"));
}


document.addEventListener('DOMContentLoaded',renderHeader);