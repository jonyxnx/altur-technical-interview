from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class CallRecordBase(BaseModel):
    filename: str
    transcript: str = ""
    summary: str = ""
    tags: List[str] = []


class CallRecordCreate(CallRecordBase):
    pass


class CallRecordResponse(CallRecordBase):
    id: str
    upload_timestamp: datetime

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    id: str
    message: str


class CallsListResponse(BaseModel):
    calls: List[CallRecordResponse]
    total: int

