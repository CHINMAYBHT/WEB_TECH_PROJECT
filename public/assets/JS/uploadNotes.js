// Selectors
let sidebar=document.querySelector(".sidebar")
let sidebarclose=document.querySelector(".top i")
let sidebaropen=document.querySelector("nav .fa-bars")
let container=document.querySelector(".container")




// Sidebar Close 
sidebarclose.addEventListener("click",()=>{
    sidebar.style.left="-100%"
    container.style.width="90%"
    container.style.margin="0px 50px 0px 50px";
})



// Sidebar Open
sidebaropen.addEventListener("click",()=>{
    sidebar.style.left="0"
    container.style.width="80%" 
    container.style.margin="0px 50px 0px 350px";
})


