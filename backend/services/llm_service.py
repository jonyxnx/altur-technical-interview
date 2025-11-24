"""
LLM service for analyzing transcripts and generating summaries and tags
"""
import os
import json
from openai import OpenAI
from typing import List, Optional


class LLMService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        self.client = OpenAI(api_key=api_key)

    async def analyze_transcript(self, transcript: str) -> tuple[str, List[str]]:
        """
        Analyze transcript and generate summary and tags
        
        Args:
            transcript: The transcript text to analyze
            
        Returns:
            Tuple of (summary, tags_list)
        """
        if not transcript or len(transcript.strip()) == 0:
            return "No transcript available.", []

        prompt = f"""Analyze the following call transcript and provide:
1. A concise summary (2-3 sentences) of the call
2. A list of relevant tags from these categories: "client wants to buy", "wrong number", "needs follow-up", "voicemail", "complaint", "inquiry", "support request", "sale completed", "appointment scheduled"

Transcript:
{transcript}

Respond in JSON format with this structure:
{{
    "summary": "Your summary here",
    "tags": ["tag1", "tag2", "tag3"]
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that analyzes call transcripts and extracts key information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )

            content = response.choices[0].message.content.strip()
            
            
            try:
               
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                content = content.strip()
                
                result = json.loads(content)
                summary = result.get("summary", "Summary not available.")
                tags = result.get("tags", [])
                
                # Ensure tags is a list
                if isinstance(tags, str):
                    tags = [tags]
                elif not isinstance(tags, list):
                    tags = []
                    
                return summary, tags
            except json.JSONDecodeError:
                lines = content.split("\n")
                summary = lines[0] if lines else "Summary not available."
                tags = []
                for line in lines:
                    if "tag" in line.lower():
                        pass
                return summary, ["needs follow-up"]
                
        except Exception as e:
            print(f"Error analyzing transcript with LLM: {e}")
          
            return f"Transcript analyzed. ({len(transcript)} characters)", ["needs follow-up"]

