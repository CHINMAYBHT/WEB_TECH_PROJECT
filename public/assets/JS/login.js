import { login, createAcc } from "./api.js";


// Get all the elements
let loginDiv=document.querySelector(".login");
let signupDiv=document.querySelector(".signup");
let loginForm = document.querySelector(".loginForm");
let signupForm = document.querySelector(".signupForm");
let password = document.querySelector(".signuppass");
let confirmPassword = document.querySelector(".signupcpass");
let confirmPasswordcheck = document.querySelector(".check");
let signinlink=document.querySelector(".loginhref");
let loginlink=document.querySelector(".signuphref");


// toggle between login and sign up forms
function switchForm(form) {
    if (form == "signupForm") {
        document.querySelectorAll('.loginForm .data').forEach(input => {
            input.value = "";
        });
        document.querySelector('.signuperror').innerText="";
        document.querySelector(".check").innerText="";
        loginDiv.style.display = "none";
        signupDiv.style.display = "flex";
    }
    else {
        document.querySelectorAll('.signupForm .data').forEach(input => {
            input.value = "";
        });
        document.querySelector('.loginerror').innerText="";
        loginDiv.style.display = "flex";
        signupDiv.style.display = "none";
    }
}


signinlink.addEventListener("click", (e) => {
    e.preventDefault();
    switchForm("loginForm");
})

loginlink.addEventListener("click", (e) => {
    e.preventDefault();
    switchForm("signupForm");
})


// validate confirm password and password equality
confirmPassword.addEventListener('input', () => {
    let passwordValue = password.value.trim();
    let confirmPasswordValue = confirmPassword.value.trim();
    if (passwordValue != confirmPasswordValue) {
        confirmPasswordcheck.innerText = "Passwords don't match";
    }
    else {
        confirmPasswordcheck.innerText = "";
    }
})




password.addEventListener('input', () => {
    let passwordValue = password.value.trim();
    let confirmPasswordValue = confirmPassword.value.trim();
    if (confirmPasswordValue != "" && passwordValue != confirmPasswordValue) {
        confirmPasswordcheck.innerText = "Passwords don't match";
    }
    else {
        confirmPasswordcheck.innerText = "";
    }
})



// Submit login form 
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let error = document.querySelector(".loginerror");
    let email = document.querySelector(".loginemail");
    let password = document.querySelector(".loginpass");
    let emailValue = email.value.trim();
    let passwordValue = password.value.trim();

    if (emailValue == "" || passwordValue == "") {
        error.innerText = "All fields are required";
        return;
    }

    if (passwordValue.length < 5) {
        error.innerText = "Password must be at least 5 characters";
        return;
    }
    
    
    
    let button = document.querySelector(".loginbtn");
    console.log("Login button found:", button);
    button.classList.add("loaderDisplay");
    console.log("Added loaderDisplay class, classes now:", button.className);
    let res = await login(emailValue, passwordValue);
    button.classList.remove("loaderDisplay");
    console.log(res.message);
    if (res.success) {
        email.value = "";
        password.value = "";
        error.innerText = "";
        window.location.href ="assets/pages/dashboard.html";
    }
    else {
        error.innerText = res.message;
    }
});





// Submit Sign up form
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let error = document.querySelector(".signuperror");
    let name = document.querySelector(".signupname");
    let email = document.querySelector(".signupemail");
    let nameValue = name.value.trim();
    let emailValue = email.value.trim();
    let passwordValue = password.value.trim();
    let confirmPasswordValue = confirmPassword.value.trim();


    if (nameValue == "" || emailValue == "" || passwordValue == "") {
        error.innerText = "All fields are required";
        return;
    }

    if (passwordValue.length < 5) {
        error.innerText = "Password must be at least 5 characters";
        return;
    }

    if (confirmPasswordValue != "" && passwordValue != confirmPasswordValue) {

        return;
    }
    let button = document.querySelector(".signupbtn");
    console.log("Signup button found:", button);
    button.classList.add("loaderDisplay");
    console.log("Added loaderDisplay class to signup, classes now:", button.className);
    let res = await createAcc(nameValue, emailValue, passwordValue);
    button.classList.remove("loaderDisplay");
    console.log(res.message);
    if (res.success) {
        name.value = "";
        email.value = "";
        password.value = "";
        confirmPassword.value = "";
        error.innerText = "";
        alert("Account created successfully");
        switchForm("loginForm");
    }
    else {
        error.innerText = res.message;
    }
});
