#!/usr/bin/env python3
"""
Script to extract content from all existing PDF notes that don't have extracted content yet.
This should be run once to process legacy PDFs in the system.
"""

import subprocess
import sys
import json
from datetime import datetime

def log_message(message):
    """Log message with timestamp."""
    timestamp = datetime.now().strftime('%d-%b-%Y %H:%M:%S %Z')
    print(f"[{timestamp}] {message}")
    sys.stdout.flush()

def main():
    """Extract content from all existing PDFs."""
    log_message("Starting batch extraction of existing PDF content...")

    try:
        # Run the content_extractor in batch mode
        cmd = ['py', 'content_extractor.py', 'batch']
        log_message(f"Running command: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            cwd='.'
        )

        log_message(f"Command stdout: {result.stdout}")
        if result.stderr:
            log_message(f"Command stderr: {result.stderr}")

        if result.returncode == 0:
            try:
                response = json.loads(result.stdout.strip())
                if response.get('success'):
                    log_message(f"Batch extraction completed successfully!")
                    log_message(f"Results: {json.dumps(response.get('results', []), indent=2)}")
                    return True
                else:
                    log_message(f"Batch extraction failed: {response.get('message', 'Unknown error')}")
                    return False
            except json.JSONDecodeError as e:
                log_message(f"Failed to parse JSON response: {e}")
                log_message(f"Raw output: {result.stdout}")
                return False
        else:
            log_message(f"Command failed with return code {result.returncode}")
            return False

    except Exception as e:
        log_message(f"Error during batch extraction: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
