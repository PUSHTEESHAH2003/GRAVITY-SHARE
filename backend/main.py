from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
from datetime import datetime, timedelta, timezone
from database import db
from models import ShareInDB, generate_code
from cloudinary_utils import upload_file, delete_file
import json
import cloudinary.utils
import httpx

app = FastAPI(title="GravityShare API")

@app.get("/")
async def root():
    return {"status": "healthy", "message": "GravityShare API is running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, code: str):
        await websocket.accept()
        if code not in self.active_connections:
            self.active_connections[code] = []
        self.active_connections[code].append(websocket)

    def disconnect(self, websocket: WebSocket, code: str):
        if code in self.active_connections:
            self.active_connections[code].remove(websocket)
            if not self.active_connections[code]:
                del self.active_connections[code]

    async def broadcast(self, message: dict, code: str):
        if code in self.active_connections:
            for connection in self.active_connections[code]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    # Start background cleanup task
    asyncio.create_task(cleanup_expired_shares())

async def cleanup_expired_shares():
    while True:
        try:
            now = datetime.now(timezone.utc)
            expired_shares = await db.shares.find({"expires_at": {"$lt": now}}).to_list(None)
            for share in expired_shares:
                # Delete from Cloudinary if it's a file
                if share.get("content_type") == "file" and share.get("file_public_id"):
                    await delete_file(share["file_public_id"])
                
                # Delete from DB
                await db.shares.delete_one({"_id": share["_id"]})
                print(f"Deleted expired share: {share.get('code')}")
        except Exception as e:
            print(f"Error in cleanup task: {e}")
        
        await asyncio.sleep(60) # Run every minute

@app.post("/share")
async def create_share(
    content_type: str = Form(...),
    text_content: str = Form(None),
    file: UploadFile = File(None)
):
    code = generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    share_data = {
        "code": code,
        "content_type": content_type,
        "created_at": datetime.now(timezone.utc),
        "expires_at": expires_at
    }

    if content_type == "text":
        if not text_content:
            raise HTTPException(status_code=400, detail="Text content is required")
        share_data["content"] = text_content
    elif content_type == "file":
        if not file:
            raise HTTPException(status_code=400, detail="File is required")
        
        try:
            file_content = await file.read()
            url, public_id, res_type = await upload_file(file_content, f"gravity_{code}_{file.filename}")
            share_data["content"] = url
            share_data["file_name"] = file.filename
            share_data["file_public_id"] = public_id
            share_data["file_resource_type"] = res_type
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    else:
        raise HTTPException(status_code=400, detail="Invalid content type")

    await db.shares.insert_one(share_data)
    # Return both absolute and relative time for robustness
    remaining = (expires_at - datetime.now(timezone.utc)).total_seconds()
    return {
        "code": code, 
        "expires_at": expires_at.isoformat().replace("+00:00", "Z"),
        "remaining_seconds": max(0, int(remaining))
    }

@app.get("/share/{code}")
async def get_share(code: str):
    share = await db.shares.find_one({"code": code.upper()})
    if not share:
        raise HTTPException(status_code=404, detail="Share not found or expired")
    
    # Convert MongoDB _id to string and dates to ISO format
    share["_id"] = str(share["_id"])
    if isinstance(share.get("expires_at"), datetime):
        expires = share["expires_at"]
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        
        share["expires_at"] = expires.isoformat().replace("+00:00", "Z")
        remaining = (expires - datetime.now(timezone.utc)).total_seconds()
        share["remaining_seconds"] = max(0, int(remaining))

    if share.get("content_type") == "file":
        try:
            public_id = share.get("file_public_id")
            res_type = share.get("file_resource_type", "auto")
            
            # Robust fallback: If metadata is missing (legacy share), parse it from the URL
            if not public_id and share.get("content"):
                url_parts = share["content"].split("/")
                try:
                    upload_idx = url_parts.index("upload")
                    parsed_res_type = url_parts[upload_idx - 1]
                    if parsed_res_type and parsed_res_type != "upload":
                        res_type = parsed_res_type
                    for i in range(upload_idx + 1, len(url_parts)):
                        if url_parts[i].startswith("v") and url_parts[i][1:].isdigit():
                            public_id = "/".join(url_parts[i+1:])
                            break
                except Exception:
                    pass

            if public_id:
                # Provide the local download link for proxying
                share["download_url"] = f"/download/{code}"
                
                # Generate internal signed URL for the backend/fallback
                try:
                    is_pdf = share.get("file_name", "").lower().endswith(".pdf") or public_id.lower().endswith(".pdf")
                    final_res_type = "image" if is_pdf else res_type
                    signing_id = public_id
                    if final_res_type in ["image", "video"] and signing_id.lower().endswith(".pdf"):
                        signing_id = signing_id[:-4]

                    signed_url = cloudinary.utils.private_download_url(
                        signing_id,
                        share.get("file_name", "download").split(".")[-1] if final_res_type in ["image", "video"] else "",
                        resource_type=final_res_type,
                        attachment=share.get("file_name", True)
                    )
                    share["content"] = signed_url
                except Exception as e:
                    print(f"Error generating internal link: {e}")
        except Exception as e:
            print(f"Error processing file share: {e}")

    return share

@app.get("/download/{code}")
async def proxy_download(code: str):
    share = await db.shares.find_one({"code": code.upper()})
    if not share or share.get("content_type") != "file":
        raise HTTPException(status_code=404, detail="File not found or not a file share")

    # 1. Identify source metadata
    public_id = share.get("file_public_id")
    res_type = share.get("file_resource_type", "auto")
    
    # 2. Parser fallback for legacy shares missing metadata
    if not public_id and share.get("content"):
        url_parts = share["content"].split("/")
        try:
            upload_idx = url_parts.index("upload")
            res_type = url_parts[upload_idx - 1]
            for i in range(upload_idx + 1, len(url_parts)):
                if url_parts[i].startswith("v") and url_parts[i][1:].isdigit():
                    public_id = "/".join(url_parts[i+1:])
                    break
        except Exception:
            pass

    if not public_id:
        raise HTTPException(status_code=404, detail="File source ID missing in database")

    is_pdf = share.get("file_name", "").lower().endswith(".pdf") or public_id.lower().endswith(".pdf")
    final_res_type = "image" if is_pdf else res_type

    # 3. RESILIENT PROXY: Try to find the file across all possible Cloudinary categories
    async def get_valid_source():
        types_to_try = [final_res_type]
        if is_pdf:
            types_to_try.append("raw" if final_res_type == "image" else "image")
        if "raw" not in types_to_try: types_to_try.append("raw")
        if "image" not in types_to_try: types_to_try.append("image")

        async with httpx.AsyncClient(timeout=10.0) as client:
            for rtype in types_to_try:
                local_id = public_id
                # Rule: Images/Videos use clean IDs (no extension); Raw uses full IDs
                if rtype in ["image", "video"]:
                    for ext in [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".mp4"]:
                        if local_id.lower().endswith(ext):
                            local_id = local_id[:-len(ext)]
                            break
                
                try:
                    target_url = cloudinary.utils.private_download_url(
                        local_id,
                        share.get("file_name", "download").split(".")[-1] if rtype in ["image", "video"] else "",
                        resource_type=rtype,
                        attachment=share.get("file_name", True)
                    )
                    
                    # PROBE: Check if Cloudinary has this file
                    resp = await client.head(target_url)
                    if resp.status_code == 200:
                        return target_url
                except Exception:
                    continue
        return None

    target_signed_url = await get_valid_source()
    if not target_signed_url:
        raise HTTPException(status_code=404, detail="File could not be found in any Cloudinary category.")

    # 4. Stream the verified URL
    async def stream_file():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("GET", target_signed_url) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(
        stream_file(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{share.get("file_name", "download")}"',
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        }
    )

@app.websocket("/ws/{code}")
async def websocket_endpoint(websocket: WebSocket, code: str):
    await manager.connect(websocket, code)
    try:
        # Notify others that someone joined
        await manager.broadcast({"type": "presence", "message": "Someone is viewing this share"}, code)
        while True:
            data = await websocket.receive_text()
            # Handle incoming signals if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, code)
