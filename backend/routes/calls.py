"""
API routes for call management
"""
import os
import json
import uuid
import hashlib
import io
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
import aiofiles
from pydub import AudioSegment

from database import get_db, CallRecord as DBCallRecord
from models import CallRecordResponse, UploadResponse, CallsListResponse
from services.stt_service import STTService
from services.llm_service import LLMService

router = APIRouter(prefix="/api/calls", tags=["calls"])

# Initialize services (lazy initialization)
stt_service = None
llm_service = None


def get_stt_service():
    """Get or initialize STT service"""
    global stt_service
    if stt_service is None:
        try:
            stt_service = STTService()
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"STT service not available: {str(e)}")
    return stt_service


def get_llm_service():
    """Get or initialize LLM service"""
    global llm_service
    if llm_service is None:
        try:
            llm_service = LLMService()
        except ValueError as e:
            raise HTTPException(status_code=500, detail=f"LLM service not available: {str(e)}")
    return llm_service

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
async def upload_audio_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload an audio file (WAV or MP3) for transcription and analysis
    """
  
    allowed_extensions = {".wav", ".mp3", ".mpeg"}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only WAV and MP3 files are allowed. Got: {file_extension}"
        )


    file_content = await file.read()
    file_size = len(file_content)
    max_size = 50 * 1024 * 1024  # 50MB
    
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 50MB limit"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )


    file_hash = hashlib.sha256(file_content).hexdigest()
    

    existing_call = db.query(DBCallRecord).filter(DBCallRecord.file_hash == file_hash).first()
    if existing_call:
        raise HTTPException(
            status_code=409,
            detail=f"Duplicate file detected. This file was already uploaded as '{existing_call.filename}' on {existing_call.upload_timestamp.isoformat()}"
        )

    
    stored_filename = file.filename
    if file_extension == ".wav":
        try:
            audio_segment = AudioSegment.from_file(io.BytesIO(file_content), format="wav")
            mp3_buffer = io.BytesIO()
            audio_segment.export(mp3_buffer, format="mp3", bitrate="96k")
            file_content = mp3_buffer.getvalue()
            file_extension = ".mp3"
            stored_filename = f"{os.path.splitext(file.filename)[0]}.mp3"
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to convert WAV to MP3: {str(e)}"
            )

    # Generate unique ID for the call
    call_id = str(uuid.uuid4())
    
   
    file_path = os.path.join(UPLOAD_DIR, f"{call_id}{file_extension}")
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_content)

    # Create database record
    db_call = DBCallRecord(
        id=call_id,
        filename=stored_filename,
        upload_timestamp=datetime.utcnow(),
        transcript="",
        summary="",
        tags="[]",
        file_hash=file_hash
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)

    # Process audio asynchronously (in a real app, use background tasks)
    try:
        # Transcribe audio
        stt = get_stt_service()
        transcript = await stt.transcribe_audio(file_path)
        
        if not transcript:
            transcript = ""
            summary = "Transcription failed. Please try again."
            tags = ["transcription failed"]
        else:
            # Analyze with LLM
            llm = get_llm_service()
            summary, tags = await llm.analyze_transcript(transcript)
            
        # Update database record
        db_call.transcript = transcript
        db_call.summary = summary
        db_call.tags = json.dumps(tags)
        db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing audio: {e}")
        # Update with error message
        db_call.summary = f"Error processing audio: {str(e)}"
        db_call.tags = json.dumps(["processing error"])
        db.commit()

    return UploadResponse(
        id=call_id,
        message="File uploaded and processing started"
    )


@router.get("/tags", response_model=List[str])
async def get_available_tags(db: Session = Depends(get_db)):
    """
    Get all available tags from all calls
    """
    db_calls = db.query(DBCallRecord).all()
    
    all_tags = set()
    print(db_calls)

    for db_call in db_calls:
        if db_call.tags:
            try:
                tags_list = json.loads(db_call.tags)
                all_tags.update(tags_list)
            except:
                pass
    
    return sorted(list(all_tags))



@router.get("", response_model=CallsListResponse)
async def get_calls(
    tag: Optional[str] = Query(None, description="Filter by tag"),
    sort: Optional[str] = Query("newest", description="Sort order: newest or oldest"),
    db: Session = Depends(get_db)
):
    """
    Get all calls with optional filtering by tag and sorting
    """
    query = db.query(DBCallRecord)
    
    # Filter by tag if provided
    if tag:
        query = query.filter(DBCallRecord.tags.contains(f'"{tag}"'))
    
    # Sort by upload timestamp
    if sort == "oldest":
        query = query.order_by(asc(DBCallRecord.upload_timestamp))
    else:  # newest (default)
        query = query.order_by(desc(DBCallRecord.upload_timestamp))
    
    db_calls = query.all()
    
    # Convert to response models
    calls = []
    for db_call in db_calls:
        tags_list = json.loads(db_call.tags) if db_call.tags else []
        calls.append(CallRecordResponse(
            id=db_call.id,
            filename=db_call.filename,
            upload_timestamp=db_call.upload_timestamp,
            transcript=db_call.transcript or "",
            summary=db_call.summary or "",
            tags=tags_list
        ))
    
    return CallsListResponse(calls=calls, total=len(calls))


@router.get("/{call_id}", response_model=CallRecordResponse)
async def get_call_by_id(
    call_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific call by ID
    """
    db_call = db.query(DBCallRecord).filter(DBCallRecord.id == call_id).first()
    
    if not db_call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    tags_list = json.loads(db_call.tags) if db_call.tags else []
    
    return CallRecordResponse(
        id=db_call.id,
        filename=db_call.filename,
        upload_timestamp=db_call.upload_timestamp,
        transcript=db_call.transcript or "",
        summary=db_call.summary or "",
        tags=tags_list
    )


@router.get("/{call_id}/audio")
async def get_call_audio(
    call_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the audio file for a specific call
    """
    db_call = db.query(DBCallRecord).filter(DBCallRecord.id == call_id).first()
    
    if not db_call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Determine file extension from filename
    file_extension = os.path.splitext(db_call.filename)[1].lower()
    if not file_extension:
        # Try common extensions
        for ext in ['.wav', '.mp3']:
            file_path = os.path.join(UPLOAD_DIR, f"{call_id}{ext}")
            if os.path.exists(file_path):
                file_extension = ext
                break
        else:
            raise HTTPException(status_code=404, detail="Audio file not found")
    else:
        file_path = os.path.join(UPLOAD_DIR, f"{call_id}{file_extension}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Determine media type
    media_type = "audio/mpeg" if file_extension == ".mp3" else "audio/wav"
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=db_call.filename
    )

