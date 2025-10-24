import google.generativeai as genai
from PyPDF2 import PdfReader

# ---------- CONFIG ----------
API_KEY = "AIzaSyAqQKp8yeh_F0rGAKXe0mhrGiCnUUkkDs4"  # Replace with your key
PDF_PATH = "SDL Topics assignment.pdf"                # Replace with your test PDF file
# ----------------------------

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF."""
    with open(pdf_path, "rb") as file:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()

def summarize_text_with_gemini(text):
    """Send text to Gemini model and get a summary."""
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"Summarize the following document in concise points:\n\n{text}"
    response = model.generate_content(prompt)
    return response.text

def main():
    try:
        text = extract_text_from_pdf(PDF_PATH)
        if not text:
            print("⚠️ No text extracted from PDF. Check if the file has selectable text.")
            return

        print("✅ PDF text extracted successfully. Sending to Gemini...\n")
        summary = summarize_text_with_gemini(text)
        print("📄 --- SUMMARY ---")
        print(summary)

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
