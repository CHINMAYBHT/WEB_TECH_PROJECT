import json
import sys
import os
from datetime import datetime
from PyPDF2 import PdfReader

# ---------- CONFIG ----------
# REPLACE THESE WITH YOUR API DETAILS
AI_API_KEY = "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"  # e.g., OpenRouter API key
MODEL_NAME = "openai/gpt-3.5-turbo"    # Reliable fallback model

# OpenAI client (you can change this to any AI provider)
try:
    from openai import OpenAI
    client = OpenAI(
        api_key=AI_API_KEY,
        base_url="https://openrouter.ai/api/v1" if "sk-or-" in AI_API_KEY else None
    )
except ImportError:
    print("OpenAI library not found. Please install with: pip install openai", file=sys.stderr)
    sys.exit(1)

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
        print("[CHAT_ACTIVITY]", *args, file=sys.stderr, **kwargs)
    except Exception:
        # Fallback if file logging fails
        print("[CHAT_ACTIVITY]", *args, file=sys.stderr, **kwargs)

def error_log(*args, **kwargs):
    """Log error messages to stderr."""
    timestamp = get_log_timestamp()
    print(f"[{timestamp}] [CHAT_ERROR]", *args, file=sys.stderr, **kwargs)

def extract_content_from_note(note_content, file_type):
    """Extract readable content from note data."""
    try:
        if file_type.upper() == 'PDF' and note_content.startswith('/uploads/'):
            # For PDFs, if we get a file path, it means no stored content was found
            # We need to extract on-demand (try to use the content_extractor script)
            import subprocess
            import json

            try:
                # Since we don't have the note_id here, we need to extract directly from the file path
                activity_log(f"Attempting on-demand extraction for PDF: {note_content}")
                # Build the full path
                script_dir = os.path.dirname(os.path.abspath(__file__))
                full_path = os.path.join(script_dir, note_content.lstrip('/'))

                if os.path.exists(full_path):
                    text = extract_text_from_pdf(full_path)
                    activity_log(f"Extracted {len(text)} characters for chat")
                    return text[:4000] if len(text) > 4000 else text  # Limit for token usage
                else:
                    return f"[PDF file not found: {note_content}]"

            except Exception as e:
                error_log(f"On-demand PDF extraction failed: {str(e)}")
                return f"[PDF Content extraction failed: {note_content}]"
        else:
            # For regular text notes, or if content is already extracted (from PHP)
            return note_content
    except Exception as e:
        error_log(f"Error extracting content: {str(e)}")
        return note_content

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF for chat purposes - simplified version."""
    try:
        with open(pdf_path, "rb") as file:
            reader = PdfReader(file)
            text = ""
            for page in reader.pages[:5]:  # Limit to first 5 pages for chat
                text += page.extract_text() or ""
                if len(text) > 4000:  # Limit content for chat
                    break
            return text.strip()
    except Exception as e:
        error_log(f"PDF extraction error: {str(e)}")
        raise

def generate_chat_response(context, user_message):
    """Generate AI response using conversation context."""

    try:
        # Parse context
        error_log(f"About to parse context: '{context[:100]}...'")
        context_data = json.loads(context) if isinstance(context, str) else context
        error_log(f"Successfully parsed context_data: {context_data.get('note_title', 'unknown')}")
        note_title = context_data.get('note_title', 'Unknown Note')
        note_content = extract_content_from_note(
            context_data.get('note_content', ''),
            context_data.get('file_type', 'Text')
        )
        conversation_history = context_data.get('conversation_history', [])

        # Build conversation context
        system_prompt = f"""You are a helpful AI assistant who can answer questions about the user's uploaded content.

CONTENT TITLE: {note_title}
CONTENT: {note_content[:4000]}... (truncated for brevity)

INSTRUCTIONS:
- Answer questions based ONLY on the provided content
- If you don't know the answer from the content, say so politely
- Keep responses helpful and informative
- Reference specific parts of the content when possible
- Maintain context from the conversation history
- Be concise but thorough

CONVERSATION HISTORY:
"""

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (last 10 messages to avoid token limits)
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Call AI API
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            max_tokens=1000,
            temperature=0.3,  # Lower temperature for more focused responses
            top_p=0.9
        )

        ai_response = response.choices[0].message.content.strip()

        activity_log(f"Generated AI response for note: {note_title}")

        return {
            "success": True,
            "message": ai_response,
            "model": MODEL_NAME
        }

    except Exception as e:
        error_log(f"Error generating chat response: {str(e)}")
        return {
            "success": False,
            "message": "I'm sorry, I encountered an error while processing your question. Please try again.",
            "error": str(e)
        }

def main():
    """Main function for chat response generation."""
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "message": "Missing arguments. Usage: python chat_response.py '<context_file>' '<user_message>'"
        }))
        sys.exit(1)

    context_file = sys.argv[1]
    user_message = sys.argv[2]

    try:
        # Read context from file
        with open(context_file, 'r', encoding='utf-8') as f:
            context = f.read().strip()

        error_log(f"Read context from file: {context[:200]}...")
    except Exception as e:
        error_log(f"Failed to read context file: {str(e)}")
        print(json.dumps({
            "success": False,
            "message": f"Failed to read context file: {str(e)}"
        }))
        sys.exit(1)

    # Generate response
    result = generate_chat_response(context, user_message)

    # Output JSON result
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()

# Example usage:
# python chat_response.py '{"note_title":"My Document","note_content":"This is the content","conversation_history":[{"role":"user","content":"Hi"}]}' "What is this about?"
