from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta, timezone
import uuid

def generate_code():
    return uuid.uuid4().hex[:6].upper()

class ShareBase(BaseModel):
    content_type: str  # "text" or "file"
    content: Optional[str] = None  # Text content or File URL
    file_name: Optional[str] = None
    file_public_id: Optional[str] = None
    file_resource_type: Optional[str] = None

class Tag(BaseModel):
    code: str = Field(default_factory=generate_code)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=1))

class ShareCreate(ShareBase):
    pass

class ShareInDB(ShareBase, Tag):
    id: Optional[str] = Field(None, alias="_id")

    class Config:
        populate_by_name = True
