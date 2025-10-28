document.addEventListener('headerLoaded', () => {
    console.log("Dashboard loaded");
    initializeStarRating();
});

document.addEventListener('loginCheckComplete', () => {
    console.log("Login check complete, updating banner button");
    const logoutBtn = document.querySelector(".logoutBtn");
    console.log("logoutBtn found:", logoutBtn);
    if(logoutBtn){
        document.querySelector(".bannerBtn").innerHTML = "Dashboard";
        console.log("Set banner button to Dashboard");
    }else{
        document.querySelector(".bannerBtn").innerHTML = "Get Started";
        console.log("Set banner button to Get Started");
    }
});

function initializeStarRating() {
    const stars = document.querySelectorAll('.stars i');
    const ratingInput = document.getElementById('rating');

    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = e.target.dataset.rating;
            ratingInput.value = rating;
            updateStars(rating);
        });

    });

    function updateStars(rating) {
        stars.forEach((s, index) => {
            if (index < rating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    }
}

function uploadNotes() {
    window.location="../pages/uploadnotes.html";
}

function viewNotes() {
    window.location="../pages/viewnotes.html";
}

function ai() {
    window.location="../pages/ai.html";
}


function getStarted() {
    window.location="/index.html";
}
