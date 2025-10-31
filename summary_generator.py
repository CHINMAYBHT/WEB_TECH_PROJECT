import google.generativeai as genai
from PyPDF2 import PdfReader
import mysql.connector
import os
import sys
import json
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime

def get_log_timestamp():
    """Get current timestamp for logging."""
    return datetime.now().strftime('%d-%b-%Y %H:%M:%S %Z')

def activity_log(*args, **kwargs):
    """Log activity messages to activity.log."""
    try:
        timestamp = get_log_timestamp()
        with open('LOGS/activity.log', 'a', encoding='utf-8') as f:
            print(f"[{timestamp}]", *args, file=f, **kwargs)
        # Also print to stderr for server logs
        print("[ACTIVITY]", *args, file=sys.stderr, **kwargs)
    except Exception:
        # Fallback if file logging fails
        print("[ACTIVITY]", *args, file=sys.stderr, **kwargs)

def error_log(*args, **kwargs):
    """Log error messages to stderr (goes to error.log via server)."""
    timestamp = get_log_timestamp()
    print(f"[{timestamp}] [ERROR]", *args, file=sys.stderr, **kwargs)

# Load environment variables from .env file
load_dotenv()

# ---------- CONFIG ----------
# API Keys
API_KEY = os.getenv('GEMINI_API_KEY')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY1')

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

# Validate required environment variables
required_vars = {
    'GEMINI_API_KEY': API_KEY,
    'OPENROUTER_API_KEY': OPENROUTER_API_KEY,
    'DB_USER': DB_USER,
    'DB_PASSWORD': DB_PASSWORD,
    'DB_NAME': DB_NAME
}

missing_vars = [name for name, value in required_vars.items() if not value]
if missing_vars:
    error_log(f"Missing required environment variables: {', '.join(missing_vars)}")
    sys.exit(1)

activity_log("Configuration loaded from environment variables")

# Initialize OpenRouter client
try:
    openai_client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )
    activity_log("OpenAI client initialized successfully")
except Exception as e:
    error_log(f"Failed to initialize OpenAI client: {str(e)}")
    sys.exit(1)
# ----------------------------

def get_db_connection():
    """Create and return a database connection."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF."""
    activity_log(f"Extracting text from PDF: {pdf_path}")
    try:
        with open(pdf_path, "rb") as file:
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            activity_log(f"Extracted {len(text)} characters from PDF")
            return text.strip()
    except Exception as e:
        error_log(f"Error extracting text from PDF: {str(e)}")
        raise

def summarize_text_with_gemini(text):
    """Send text to Gemini model and get a summary."""
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"Summarize the following document in concise points:\n\n{text}"
    response = model.generate_content(prompt)
    return response.text

def generate_quiz_with_openai(text):
    """Send text to OpenRouter API and get 10 MCQ questions."""
    prompt = f"""Generate 10 multiple-choice questions (MCQs) based on the following document. Each question should have:
- One correct answer
- Three incorrect options
- Questions should test key concepts from the content

Return ONLY valid JSON array in this exact format (no markdown, no code blocks, no extra text):

[
    {{
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": "A"
    }},
    ... (9 more questions)
]

Document content:
{text}
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Using a cost-effective model via OpenRouter
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7
        )
        quiz_json = response.choices[0].message.content.strip()

        # Clean up any markdown formatting that might be present
        if quiz_json.startswith('```json'):
            quiz_json = quiz_json[7:-3]
        elif quiz_json.startswith('```'):
            quiz_json = quiz_json[3:-3]

        # Try to parse the JSON
        quiz_questions = json.loads(quiz_json)

        # Validate the structure
        if not isinstance(quiz_questions, list) or len(quiz_questions) != 10:
            raise ValueError("Invalid quiz format: Expected list of 10 questions")

        for i, question in enumerate(quiz_questions):
            if not all(key in question for key in ['question', 'options', 'correct']):
                raise ValueError(f"Question {i+1} missing required fields")
            if not isinstance(question['options'], list) or len(question['options']) != 4:
                raise ValueError(f"Question {i+1} should have 4 options")
            if question['correct'] not in ['A', 'B', 'C', 'D']:
                raise ValueError(f"Question {i+1} has invalid correct answer: {question['correct']}")

        return quiz_questions
    except json.JSONDecodeError as e:
        error_log(f"JSON parsing error: {str(e)}")
        error_log(f"Raw response: {quiz_json[:500]}...")
        raise ValueError("Invalid JSON response from AI")
    except Exception as e:
        error_log(f"Error generating quiz: {str(e)}")
        raise


def get_note_content(note_id, user_id):
    """Get note content from database."""
    try:
        activity_log(f"Attempting to fetch note_id={note_id} for user_id={user_id}")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # First, check if the note exists and is accessible
        query = "SELECT id, title, content, file_type, user_id FROM notes WHERE id = %s"
        cursor.execute(query, (note_id,))
        note = cursor.fetchone()

        if not note:
            activity_log(f"Note with id={note_id} does not exist")
            return None

        if str(note['user_id']) != str(user_id):
            activity_log(f"User {user_id} does not have access to note {note_id}")
            return None

        activity_log(f"Found note: {note}")
        return note

    except Exception as e:
        error_log(f"Database error in get_note_content: {str(e)}")
        return None
    finally:
        try:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals() and conn.is_connected():
                conn.close()
        except Exception as e:
            error_log(f"Error closing database connection: {str(e)}")

def save_summary_to_db(note_id, user_id, summary_text, ai_model="gemini-2.5-flash"):
    """Save summary to database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert or update summary
        query = """
        INSERT INTO summaries (note_id, user_id, summary_text, ai_model)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        summary_text = VALUES(summary_text),
        created_at = NOW()
        """

        cursor.execute(query, (note_id, user_id, summary_text, ai_model))
        conn.commit()

        cursor.close()
        conn.close()

        return True
    except Exception as e:
        return False

def save_quiz_to_db(note_id, user_id, quiz_questions, note_title=None):
    """Save quiz questions to database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Convert to JSON string for storage
        questions_json = json.dumps(quiz_questions)

        # Insert or update quiz
        query = """
        INSERT INTO quizzes (note_id, user_id, questions, title)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        questions = VALUES(questions),
        title = VALUES(title),
        created_at = NOW()
        """

        cursor.execute(query, (note_id, user_id, questions_json, note_title))
        quiz_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return quiz_id
    except Exception as e:
        error_log(f"Error saving quiz: {str(e)}")
        return False

def generate_summary(note_id, user_id):
    """Generate and save summary for a note."""
    try:
        # Get note details
        note = get_note_content(note_id, user_id)
        if not note:
            return {"success": False, "message": "Note not found"}

        # Check if we have stored extracted content for PDFs
        if note['file_type'] == 'PDF Document':
            # First try to get stored extracted content
            try:
                conn_check = get_db_connection()
                cursor_check = conn_check.cursor(dictionary=True)
                cursor_check.execute(
                    "SELECT extracted_text FROM extracted_content WHERE note_id = %s AND extraction_status = 'completed'",
                    (note_id,)
                )
                stored_content = cursor_check.fetchone()
                cursor_check.close()
                conn_check.close()

                if stored_content and stored_content['extracted_text']:
                    text_to_summarize = stored_content['extracted_text']
                    activity_log(f"Using stored extracted content for note {note_id} ({len(text_to_summarize)} characters)")

                else:
                    # Fallback: extract on-demand
                    activity_log(f"No stored content found, extracting on-demand for note {note_id}")
                    pdf_path = note['content']

                    if not os.path.isabs(pdf_path):
                        script_dir = os.path.dirname(os.path.abspath(__file__))
                        full_path = os.path.join(script_dir, pdf_path.lstrip('/'))
                    else:
                        full_path = pdf_path

                    activity_log(f"Processing PDF file: {full_path}")

                    if not os.path.exists(full_path):
                        error_msg = f"PDF file not found at: {full_path}"
                        error_log(error_msg)
                        return {"success": False, "message": error_msg}

                    text_to_summarize = extract_text_from_pdf(full_path)
                    if not text_to_summarize.strip():
                        error_msg = "Extracted text from PDF is empty"
                        error_log(error_msg)
                        return {"success": False, "message": error_msg}

                    activity_log(f"Extracted {len(text_to_summarize)} characters from PDF on-demand")

            except Exception as e:
                error_msg = f"Error accessing extracted content or processing PDF: {str(e)}"
                error_log(error_msg)
                return {"success": False, "message": error_msg}
        else:
            # For non-PDF content
            text_to_summarize = note['content']
            if not text_to_summarize.strip():
                error_msg = "Note content is empty"
                error_log(error_msg)
                return {"success": False, "message": error_msg}

        # Generate summary
        try:
            # Use the correct variable name that was set in the code above
            summary = summarize_text_with_gemini(text_to_summarize)
            if not summary or not summary.strip():
                return {"success": False, "message": "Failed to generate summary - empty response from AI model"}

        except Exception as e:
            return {"success": False, "message": f"Error generating summary: {str(e)}"}

        # Save to database
        try:
            if save_summary_to_db(note_id, user_id, summary):
                return {
                    "success": True,
                    "summary": {
                        "content": summary,
                        "note_id": note_id,
                        "user_id": user_id,
                        "ai_model": "gemini-2.5-flash"
                    },
                    "message": "Summary generated successfully"
                }
            else:
                return {"success": False, "message": "Failed to save summary to database"}

        except Exception as e:
            return {"success": False, "message": f"Database error: {str(e)}"}

    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}

def generate_quiz(note_id, user_id):
    """Generate and save quiz for a note."""
    try:
        # Get note details
        note = get_note_content(note_id, user_id)
        if not note:
            return {"success": False, "message": "Note not found"}

        # Extract text same as summary - prioritize stored content
        if note['file_type'] == 'PDF Document':
            # First try to get stored extracted content
            try:
                conn_check = get_db_connection()
                cursor_check = conn_check.cursor(dictionary=True)
                cursor_check.execute(
                    "SELECT extracted_text FROM extracted_content WHERE note_id = %s AND extraction_status = 'completed'",
                    (note_id,)
                )
                stored_content = cursor_check.fetchone()
                cursor_check.close()
                conn_check.close()

                if stored_content and stored_content['extracted_text']:
                    text_to_quiz = stored_content['extracted_text']
                    activity_log(f"Using stored extracted content for quiz generation on note {note_id}")

                else:
                    # Fallback: extract on-demand
                    activity_log(f"No stored content found for quiz, extracting on-demand for note {note_id}")
                    pdf_path = note['content']
                    if not os.path.isabs(pdf_path):
                        script_dir = os.path.dirname(os.path.abspath(__file__))
                        full_path = os.path.join(script_dir, pdf_path.lstrip('/'))
                    else:
                        full_path = pdf_path

                    if not os.path.exists(full_path):
                        return {"success": False, "message": f"PDF file not found: {full_path}"}

                    text_to_quiz = extract_text_from_pdf(full_path)
                    if not text_to_quiz.strip():
                        return {"success": False, "message": "Extracted text from PDF is empty"}

            except Exception as e:
                return {"success": False, "message": f"Error accessing extracted content: {str(e)}"}
        else:
            text_to_quiz = note['content']
            if not text_to_quiz.strip():
                return {"success": False, "message": "Note content is empty"}

        # Generate quiz
        try:
            quiz_questions = generate_quiz_with_openai(text_to_quiz)
            if not quiz_questions or len(quiz_questions) != 10:
                return {"success": False, "message": "Failed to generate 10 questions"}

        except Exception as e:
            return {"success": False, "message": f"Error generating quiz: {str(e)}"}

        # Save to database
        try:
            note_title = note.get('title', 'Untitled Quiz')
            quiz_id = save_quiz_to_db(note_id, user_id, quiz_questions, note_title)
            if quiz_id:
                return {
                    "success": True,
                    "quiz": {
                        "id": quiz_id,
                        "note_id": note_id,
                        "user_id": user_id,
                        "title": note_title,
                        "questions": quiz_questions
                    },
                    "message": "Quiz generated successfully"
                }
            else:
                return {"success": False, "message": "Failed to save quiz to database"}

        except Exception as e:
            return {"success": False, "message": f"Database error: {str(e)}"}

    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}

def main():
    """Main function when script is run directly."""
    import sys
    import io

    # Set default encoding to UTF-8 for stdout and stderr
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    # Save original stdout and stderr
    original_stdout = sys.stdout
    original_stderr = sys.stderr

    try:
        if len(sys.argv) < 4:
            raise ValueError("Insufficient arguments. Usage: python summary_generator.py <mode> <note_id> <user_id>")

        mode = sys.argv[1].lower()
        note_id = sys.argv[2]
        user_id = sys.argv[3]

        # Generate the result - all output here will go to stderr
        sys.stdout = sys.stderr
        if mode == "summary":
            result = generate_summary(note_id, user_id)
        elif mode == "quiz":
            result = generate_quiz(note_id, user_id)
        else:
            result = {"success": False, "message": f"Unknown mode: {mode}"}

        # Ensure the result is a dictionary
        if not isinstance(result, dict):
            result = {
                "success": False,
                "message": f"Unexpected result type: {type(result).__name__}"
            }

        # Switch back to original stdout for JSON output
        sys.stdout = original_stdout

        try:
            # Output only the JSON result to stdout
            json.dump(result, sys.stdout, ensure_ascii=False)
            sys.stdout.flush()
        except UnicodeEncodeError:
            # If we still get encoding errors, force ASCII output
            json.dump(result, sys.stdout, ensure_ascii=True)
            sys.stdout.flush()

    except Exception as e:
        # Ensure we're using the original stdout for error output
        if sys.stdout is not original_stdout:
            sys.stdout = original_stdout

        error_msg = f"Error in generation: {str(e)}"
        try:
            # Try to output JSON with Unicode
            json.dump({
                "success": False,
                "message": error_msg
            }, sys.stdout, ensure_ascii=False)
        except UnicodeEncodeError:
            # Fall back to ASCII output
            json.dump({
                "success": False,
                "message": "An error occurred while generating content"
            }, sys.stdout, ensure_ascii=True)

        # Log the full error to stderr
        print(f"[ERROR] {error_msg}", file=original_stderr)
        import traceback
        traceback.print_exc(file=original_stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
