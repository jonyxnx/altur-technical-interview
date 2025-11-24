"""
Speech-to-Text service using OpenAI Whisper API
"""
import os
from openai import OpenAI
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class STTService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        self.client = OpenAI(api_key=api_key)

    async def transcribe_audio(self, file_path: str) -> Optional[str]:
        """
        Transcribe audio file using OpenAI Whisper API
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Transcript text or None if transcription fails
        """
        try:
            with open(file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
                return transcript if isinstance(transcript, str) else str(transcript)
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None

