import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

async def upload_file(file_content, filename):
    # motor or other async libs don't always support cloudinary's sync upload well, 
    # but for simplicity we'll use the standard uploader.
    # In a production app, we might use a threadpool.
    upload_result = cloudinary.uploader.upload(
        file_content, 
        public_id=filename, 
        resource_type="auto",
        access_mode="public"
    )
    return upload_result.get("secure_url"), upload_result.get("public_id"), upload_result.get("resource_type")

async def delete_file(public_id):
    if public_id:
        cloudinary.uploader.destroy(public_id)
