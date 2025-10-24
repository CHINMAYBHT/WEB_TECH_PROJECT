## To Run Files

php -c "C:\php\php.ini" -S localhost:8080

browser-sync start --server "public" --files "public/*.html, public/assets/css/*.css, public/assets/js/*.js"
- above command in another terminal window
- open localhost:3000

## File Structure

```
ai_study_helper/
│
├── public/                            # Web root (frontend)
│   ├── index.html                      # Login page
│   ├── dashboard.html                  # Dashboard page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   └── bootstrap.min.css
│   │   ├── js/
│   │   │   ├── login.js                # Handles login interactions & fetch to backend
│   │   │   ├── dashboard.js            # Handles dashboard components
│   │   │   ├── quiz.js                 # Quiz component logic
│   │   │   ├── api.js                  # Shared fetch functions / utilities
│   │   │   ├── header.js               # Header component template & render function
│   │   │   └── footer.js               # Footer component template & render function
│   │   ├── templates/                  # Optional: separate HTML snippets for fetch
│   │   │   ├── header.html
│   │   │   └── footer.html
│   │   ├── images/
│   └── uploads/
│       └── notes/                      # User-uploaded notes (PDF, TXT, etc.)
│
├── backend/                            # PHP backend APIs
│   ├── config.php                       # Database connection, API keys
│   ├── auth.php                         # Login validation, session management
│   ├── dashboard.php                    # Returns dashboard data for a user
│   ├── notes.php                        # Handles note uploads, summaries, fetch
│   └── quiz.php                         # Generates quizzes and returns data
│
├── database/                            # Database scripts
│   ├── init.sql                         # Create tables: users, notes, quizzes
│   └── models.php                       # DB operations / CRUD functions
│
├── logs/
│   └── error.log                         # Backend error and activity logs
├── .env                                  # Database credentials, API keys
└── README.md
```
## Example for logs 
- error.log: Logs backend errors, such as database connection issues or API call failures.
- activity.log: Tracks user actions, like login attempts, note uploads, and quiz submissions.
```javascript
//any php backend file
ini_set("log_errors", 1);
ini_set("error_log", __DIR__ . '/../logs/error.log');
error_log("Database connection failed: " . $e->getMessage());
```
## Example for api file Use
```javascript
// api.js
export async function login(username, password) {
    const response = await fetch('backend/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return await response.json();
}

// login.js
import { login } from './api.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const result = await login(username, password);

    if(result.success) {
        // redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        // show error message
        document.getElementById('errorMsg').innerText = result.message;
    }
});
