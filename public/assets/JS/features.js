document.addEventListener('headerLoaded', () => {
    console.log("Features page loaded");

    // Mock loading functions for demonstration
    function generate() {
        return new Promise((resolve) => {
            setTimeout(() => resolve("generated successfully!"), 2000);
        });
    }


    // Generate Summary button
    const generatebtns = document.querySelectorAll('.generatebtn');
    generatebtns.forEach((generatebtn) => {
        generatebtn.addEventListener('click', async () => {
            console.log("Generating...");
            generatebtn.classList.add('generating');
            const result = await generate();
            generatebtn.classList.remove('generating');
    
            setTimeout(() => {
                alert(result);
                window.location = `../pages/${generatebtn.getAttribute('id')}.html`;
            }, 100);
        })
    });
});
