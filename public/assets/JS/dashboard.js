import { submitFeedback as submitFeedbackAPI } from "./api.js";

document.addEventListener('headerLoaded', () => {
    console.log("Dashboard loaded");
    initializeStarRating();
});

document.addEventListener('loginCheckComplete', () => {
    console.log("Login check complete, updating banner button");
    const logoutBtn = document.querySelector(".logoutBtn");
    console.log("logoutBtn found:", logoutBtn);
    if(logoutBtn){
        document.querySelector(".bannerBtn").innerHTML = "Upload Notes";
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
}

// Global function to update star ratings
function updateStars(rating) {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((s, index) => {
        if (index < rating) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

function uploadNotes() {
    window.location="../pages/uploadNotes.html";
}

function viewNotes() {
    window.location="../pages/uploadNotes.html";
}

function ai() {
    window.location="../pages/uploadNotes.html";
}


function getStarted() {
    if(document.getElementsByClassName("bannerBtn")[0].innerHTML=="Upload Notes"){
        window.location="../pages/uploadNotes.html";
    }else{
        window.location="/index.html";
    }
}

function report() {
    window.location="../pages/report.html";
}



// Expose functions to global window object for inline onclick handlers
window.uploadNotes = uploadNotes;
window.viewNotes = viewNotes;
window.ai = ai;
window.getStarted = getStarted;
window.submitFeedback = submitFeedback;
window.report = report;
window.initializeStarRating = initializeStarRating;
window.updateStars = updateStars;

async function submitFeedback(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const rating = document.getElementById('rating').value;

    if (!name || !email || !message) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const result = await submitFeedbackAPI(name, email, message, rating);

        if (result.success) {
            alert('Feedback Form successfully submitted');
            // Clear the form
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('message').value = '';
            document.getElementById('rating').value = '0';
            // Reset stars
            updateStars(0);
        } else {
            alert('Failed to submit feedback: ' + result.message);
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('An error occurred while submitting feedback');
    }
}
