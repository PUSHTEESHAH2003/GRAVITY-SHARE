import re
import os

def sanitize_filename(filename):
    name_part = filename
    extension = ""
    if "." in filename:
        name_part, extension = os.path.splitext(filename)
    
    # Cloudinary public_id best practices: no spaces, only allowed special chars
    clean_id = re.sub(r'[^a-zA-Z0-9_\-]', '_', name_part)
    return clean_id

# Test cases
test_files = [
    "My Homework.pdf",
    "vacation (2024).jpg",
    "report_v1.0.docx",
    "space core #9.mp4",
    "simple.txt"
]

print("Testing Filename Sanitization:")
for f in test_files:
    print(f"'{f}' -> '{sanitize_filename(f)}'")
