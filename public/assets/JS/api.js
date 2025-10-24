const BaseURL = 'http://localhost:8080/'
export async function login(email, password) {
    const response = await fetch(`${BaseURL}BACKEND/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password })
    });
    return await response.json();
}

export async function createAcc(name,email,password) {
    const response = await fetch(`${BaseURL}BACKEND/createAcc.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name,email,password })
    });
    return await response.json();
}
