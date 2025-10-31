# AI Study Helper - Setup Guide

## Prerequisites
- Python 3.8 or higher
- MySQL Server 8.0+
- Node.js 16+ and npm (for frontend)
- Git

## 1. Clone the Repository
```bash
git clone <repository-url>
cd WEB_TECH_PROEJCT
```

## 2. Set Up Python Environment
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

## 3. Configure Environment
1. Create a `.env` file in the project root:
   ```bash
   cp .envExample .env
   ```
2. Edit `.env` with your configuration:
   ```plaintext
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=ai_study_helper
   GEMINI_API_KEY=your_gemini_api_key
   OPENROUTER_API_KEY1=your_openrouter_key1
   OPENROUTER_API_KEY2=your_openrouter_key2
   MODEL_NAME=openai/gpt-3.5-turbo
   ```

## 4. Set Up Database
1. Start MySQL server
2. Create database and import schema:
   ```sql
   CREATE DATABASE ai_study_helper;
   ```
   ```bash
   mysql -u your_username -p ai_study_helper < DATABASE/init.sql
   ```

## 5. Set Up Frontend (if applicable)
```bash
cd public
npm install
npm run build
```
## To Run Files

- php -c "C:\php\php.ini" -S localhost:8080

- browser-sync start --server "public" --files "public/*.html, public/assets/css/*.css, public/assets/js/*.js" 
- (if u wish to sync changes in your frontend files with the browser automatically)
- above command in another terminal window
- open localhost:3000

## Troubleshooting

### Common Issues
1. **Module Not Found**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Connection Issues**
   - Verify MySQL is running
   - Check `.env` credentials
   - Ensure database `ai_study_helper` exists

3. **API Key Errors**
   - Verify all API keys in `.env` are valid
   - Chck for any rate limits on your API keys

## Project Structure
```
.
├── BACKEND/           # PHP backend files
├── DATABASE/          # Database schema and queries
├── LOGS/              # Application logs (not versioned)
├── public/            # Frontend files
├── .env               # Environment variables (create from .envExample)
├── .gitignore         # Git ignore rules
├── requirements.txt   # Python dependencies
├── setup.md           # This file
└── *.py              # Python application files
```

## Support
For additional help, please open an issue in the repository.
