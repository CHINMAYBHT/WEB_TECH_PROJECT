import { loginStatus, logoutStatus } from "../JS/api.js";

async function renderHeader() {
    const response = await fetch("../Templates/header.html");
    const html = await response.text();
    // Try both .header class and #header id (for reports page)
    const headerElement = document.querySelector(".header") || document.querySelector("#header");
    if (!headerElement) {
        console.error("Header element not found");
        return;
    }
    headerElement.innerHTML = html;

    //  Dispatch event to tell other scripts the header is ready
    document.dispatchEvent(new Event("headerLoaded"));
}

async function fetchUser() {
    const data = await loginStatus();
    console.log(data.success);
    if (data.success) {
        document.querySelector(".profile").innerHTML = `
            <li><i class="fa-solid fa-user"></i></li>
            <li><button class="logoutBtn" onclick="logout()">Logout</button></li>
        `;



        // Add logout event listener after setting the HTML
        document.querySelector(".logoutBtn").addEventListener("click", async () => {
            const response = await logoutStatus();
            if (response.success) {
                document.querySelector(".profile").innerHTML = `
            <li><button class="loginBtn" onclick="login()">Login</button></li>
        `;
                // Reset banner button to "Get Started" after logout
                const bannerBtn = document.querySelector(".bannerBtn");
                if (bannerBtn) {
                    bannerBtn.innerHTML = "Get Started";
                }
            }
        });
    } else {
        // Ensure "Get Started" for non-logged-in users
        const bannerBtn = document.querySelector(".bannerBtn");
        if (bannerBtn) {
            bannerBtn.innerHTML = "Get Started";
        }
    }
}


window.login = function () {
    window.location.href = "/index.html";
}
window.logout = function () {
    document.querySelector(".logoutBtn").addEventListener("click", async () => {
        console.log("Logout clicked");
        const response = await logoutStatus();
        if (response.success) {
            document.querySelector(".profile").innerHTML = `
            <li><i class="fa-solid fa-user"></i></li>
            <li><button class="loginBtn">Login</button></li>
        `;
        }
    })
}
document.addEventListener('DOMContentLoaded', () => {
    renderHeader().then(async () => {
         await fetchUser();
         // Dispatch event after login check completes
         document.dispatchEvent(new Event("loginCheckComplete"));
    });
});
