import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

import re

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_file(file_content, filename, code):
    try:
        # Sanitize filename for public_id: remove extension and special chars
        name_part = filename
        extension = ""
        if "." in filename:
            name_part, extension = os.path.splitext(filename)
        
        # Cloudinary public_id best practices: no spaces, only allowed special chars
        clean_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', name_part)
        
        # STRATEGY: Treat PDFs and documents as 'raw' assets.
        # This resolves the 401/404 errors by skipping image-processing logic.
        is_document = extension.lower() in [".pdf", ".docx", ".doc", ".txt", ".zip", ".rar", ".exe", ".apk"]
        rtype = "raw" if is_document else "auto"
        
        # We append the unique sharing code to the ID to prevent collisions
        # For 'raw' assets, we MUST include the extension for best compatibility
        clean_id = f"{clean_name}_{code}"
        if rtype == "raw" and extension:
            clean_id = f"{clean_name}_{code}{extension}"
        
        print(f"Uploading to Cloudinary [{rtype}]: {filename} as {clean_id}")
        
        upload_result = cloudinary.uploader.upload(
            file_content, 
            public_id=clean_id, 
            resource_type=rtype,
            type="authenticated"
        )
        
        return (
            upload_result.get("secure_url"), 
            upload_result.get("public_id"), 
            upload_result.get("resource_type"),
            f"v{upload_result.get('version')}"
        )
    except Exception as e:
        print(f"CLOUDINARY UPLOAD ERROR: {str(e)}")
        raise e

def delete_file(public_id, resource_type="auto", delivery_type="authenticated"):
    if public_id:
        try:
            cloudinary.uploader.destroy(public_id, resource_type=resource_type, type=delivery_type)
        except Exception as e:
            print(f"CLOUDINARY DELETE ERROR: {e}")
