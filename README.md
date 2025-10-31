## To Run Files

php -c "C:\php\php.ini" -S localhost:8080

browser-sync start --server "public" --files "public/*.html, public/assets/css/*.css, public/assets/js/*.js"
- above command in another terminal window
- open localhost:3000

## Example for logs 
- error.log: Logs backend errors, such as database connection issues or API call failures.
- activity.log: Tracks user actions, like login attempts, note uploads, and quiz submissions.
```javascript
//any php backend file
ini_set("log_errors", 1);
ini_set("error_log", __DIR__ . '/../logs/error.log');
error_log("Database connection failed: " . $e->getMessage());
```