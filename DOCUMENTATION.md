started with the folder structure.
create templates to store repeated html contents like header and footer. Load them dynamically into the web pages using header.js or footer.js. 
Include these js scripts in the html of the webpage. 
The header.js file dispatches an event to tell other scripts the header is ready.
Other scripts can listen to this event and execute their code only after the header is ready using document.addEventListener('nameoftheevent',()=>{})