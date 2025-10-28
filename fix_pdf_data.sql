-- Migration script to fix existing PDF entries in the database
-- Run this in your MySQL database to migrate old PDF uploads to the new file-based system

-- First, create the uploads directory if it doesn't exist (run this in shell)
-- mkdir -p public/uploads

-- Step 1: Identify notes that should be PDFs but aren't stored properly
-- These would have file_type set to something else or have .pdf in the content

-- Update file_type for records that contain PDF filenames
UPDATE notes
SET file_type = 'PDF Document'
WHERE file_type != 'PDF Document'
  AND content LIKE '%.pdf';

-- For records that should be PDFs but only have filenames,
-- you can't automatically convert them to file-based PDFs because the actual PDF files don't exist
-- You would need to re-upload those PDFs using the new system

-- Step 2: Show current state of PDF records
SELECT id, title, file_type, content, created_at
FROM notes
WHERE file_type = 'PDF Document'
   OR content LIKE '%.pdf'
ORDER BY created_at DESC;

-- Step 3: Clean up records that have filename-only PDFs (no file path)
-- These should be re-uploaded using the new PDF upload system
UPDATE notes
SET content = CONCAT('OLD_FILENAME: ', content),
    file_type = 'Old PDF - Needs Re-upload'
WHERE file_type = 'PDF Document'
  AND content NOT LIKE '/uploads/%'
  AND LENGTH(content) > 0;

-- This marks old PDFs for re-upload while preserving the filename reference
