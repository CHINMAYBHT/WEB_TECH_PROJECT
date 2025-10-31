import mysql.connector
import os
import sys
import json
from datetime import datetime
from PyPDF2 import PdfReader
from dotenv import load_dotenv

def get_log_timestamp():
    """Get current timestamp for logging."""
    return datetime.now().strftime('%d-%b-%Y %H:%M:%S %Z')

def activity_log(*args, **kwargs):
    """Log activity messages to activity.log."""
    try:
        timestamp = get_log_timestamp()
        with open('LOGS/activity.log', 'a', encoding='utf-8') as f:
            print(f"[{timestamp}]", *args, file=f, **kwargs)
        print("[CONTENT_EXTRACTOR]", *args, file=sys.stderr, **kwargs)
    except Exception:
        print("[CONTENT_EXTRACTOR]", *args, file=sys.stderr, **kwargs)

def error_log(*args, **kwargs):
    """Log error messages to stderr."""
    timestamp = get_log_timestamp()
    print(f"[{timestamp}] [CONTENT_ERROR]", *args, file=sys.stderr, **kwargs)

# Load environment variables
load_dotenv()

# Database configuration from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "ai_study_helper")

activity_log("Content extractor database configuration loaded")

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

def get_note_content(note_id):
    """Get note file path from database."""
    try:
        activity_log(f"Fetching note {note_id} for content extraction")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT id, user_id, content, file_type FROM notes WHERE id = %s"
        cursor.execute(query, (note_id,))
        note = cursor.fetchone()

        cursor.close()
        conn.close()

        if not note:
            activity_log(f"Note {note_id} not found")
            return None

        return note

    except Exception as e:
        error_log(f"Database error in get_note_content: {str(e)}")
        return None

def store_extracted_content(note_id, user_id, extracted_text, status='completed', error_msg=None):
    """Store extracted content in the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO extracted_content (note_id, user_id, extracted_text, extraction_status, error_message, extracted_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
        extracted_text = VALUES(extracted_text),
        extraction_status = VALUES(extraction_status),
        error_message = VALUES(error_message),
        extracted_at = NOW()
        """

        cursor.execute(query, (note_id, user_id, extracted_text, status, error_msg))
        conn.commit()

        cursor.close()
        conn.close()

        activity_log(f"Stored extracted content for note {note_id}, status: {status}")
        return True

    except Exception as e:
        error_log(f"Error storing extracted content: {str(e)}")
        return False

def get_extracted_content(note_id):
    """Get stored extracted content for a note."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM extracted_content WHERE note_id = %s AND extraction_status = 'completed'"
        cursor.execute(query, (note_id,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        return result

    except Exception as e:
        error_log(f"Error getting extracted content: {str(e)}")
        return None

def extract_and_store_content(note_id):
    """Extract content from a note's PDF and store it."""
    try:
        # Get note details
        note = get_note_content(note_id)
        if not note:
            return {"success": False, "message": "Note not found"}

        if note['file_type'] != 'PDF Document':
            return {"success": False, "message": "Note is not a PDF document"}

        # Get PDF file path
        pdf_path = note['content']
        if not os.path.isabs(pdf_path):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            full_path = os.path.join(script_dir, pdf_path.lstrip('/'))
        else:
            full_path = pdf_path

        activity_log(f"Processing PDF: {full_path}")

        if not os.path.exists(full_path):
            error_msg = f"PDF file not found: {full_path}"
            store_extracted_content(note_id, note['user_id'], '', 'failed', error_msg)
            return {"success": False, "message": error_msg}

        # Extract text
        try:
            extracted_text = extract_text_from_pdf(full_path)
            if not extracted_text.strip():
                error_msg = "Extracted text is empty"
                store_extracted_content(note_id, note['user_id'], '', 'failed', error_msg)
                return {"success": False, "message": error_msg}

            # Store the extracted content
            if store_extracted_content(note_id, note['user_id'], extracted_text):
                return {
                    "success": True,
                    "message": "Content extracted and stored successfully",
                    "note_id": note_id,
                    "text_length": len(extracted_text)
                }
            else:
                return {"success": False, "message": "Failed to store extracted content"}

        except Exception as e:
            error_msg = f"Error during text extraction: {str(e)}"
            store_extracted_content(note_id, note['user_id'], '', 'failed', error_msg)
            return {"success": False, "message": error_msg}

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        error_log(error_msg)
        return {"success": False, "message": error_msg}

def get_all_pdf_notes():
    """Get all PDF notes that need content extraction."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT n.id, n.user_id, n.content, n.file_type
        FROM notes n
        LEFT JOIN extracted_content ec ON n.id = ec.note_id
        WHERE n.file_type = 'PDF Document'
        AND (ec.note_id IS NULL OR ec.extraction_status != 'completed')
        """

        cursor.execute(query)
        notes = cursor.fetchall()

        cursor.close()
        conn.close()

        activity_log(f"Found {len(notes)} PDF notes needing content extraction")
        return notes

    except Exception as e:
        error_log(f"Error getting PDF notes: {str(e)}")
        return []

def main():
    """Main function for content extraction."""
    import io

    # Set UTF-8 encoding for output
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    try:
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "message": "Usage: py content_extractor.py <mode> [note_id]"}))
            sys.exit(1)

        mode = sys.argv[1].lower()

        if mode == "extract" and len(sys.argv) >= 3:
            # Extract content for a specific note
            note_id = sys.argv[2]
            activity_log(f"Extracting content for note {note_id}")
            result = extract_and_store_content(note_id)

        elif mode == "batch":
            # Extract content for all unprocessed PDFs
            notes = get_all_pdf_notes()
            results = []

            for note in notes:
                activity_log(f"Processing note {note['id']}")
                result = extract_and_store_content(note['id'])
                results.append({
                    "note_id": note['id'],
                    "success": result["success"],
                    "message": result["message"]
                })

            result = {
                "success": True,
                "message": f"Batch extraction completed for {len(notes)} notes",
                "results": results
            }

        elif mode == "get" and len(sys.argv) >= 3:
            # Get stored extracted content for a note
            note_id = sys.argv[2]
            extracted = get_extracted_content(note_id)

            if extracted:
                result = {
                    "success": True,
                    "note_id": note_id,
                    "extracted_text": extracted['extracted_text'],
                    "extracted_at": extracted['extracted_at'].strftime('%Y-%m-%d %H:%M:%S') if extracted['extracted_at'] else None
                }
            else:
                result = {
                    "success": False,
                    "message": "No extracted content found for this note"
                }

        else:
            result = {"success": False, "message": "Invalid mode or missing arguments"}

        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        error_msg = f"Error in content extractor: {str(e)}"
        error_log(error_msg)
        print(json.dumps({
            "success": False,
            "message": error_msg
        }))

if __name__ == "__main__":
    main()
