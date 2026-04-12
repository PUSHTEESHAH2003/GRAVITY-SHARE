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

def upload_file(file_content, filename):
    try:
        # Sanitize filename for public_id: remove extension and special chars
        # Standardize: alphanumeric and underscores/hyphens only
        name_part = filename
        extension = ""
        if "." in filename:
            name_part, extension = os.path.splitext(filename)
        
        # Cloudinary public_id best practices: no spaces, only allowed special chars
        clean_id = re.sub(r'[^a-zA-Z0-9_\-]', '_', name_part)
        
        print(f"Uploading to Cloudinary: {filename} as {clean_id}")
        
        # resource_type="auto" works well for most things, but we can be explicit
        # if Cloudinary fails to guess.
        upload_result = cloudinary.uploader.upload(
            file_content, 
            public_id=clean_id, 
            resource_type="auto",
            access_mode="public"
        )
        
        return (
            upload_result.get("secure_url"), 
            upload_result.get("public_id"), 
            upload_result.get("resource_type")
        )
    except Exception as e:
        print(f"CLOUDINARY UPLOAD ERROR: {str(e)}")
        raise e

def delete_file(public_id):
    if public_id:
        try:
            cloudinary.uploader.destroy(public_id)
        except Exception as e:
            print(f"CLOUDINARY DELETE ERROR: {e}")
