from pydantic import BaseModel, Field
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class StudentProfile(BaseModel):
    # This would be defined by the actual data in the student profile
    pass

class GraphSnippet(BaseModel):
    # This would be defined by the actual data in the graph snippet
    pass

class Analysis(BaseModel):
    uid: str
    thread_id: str
    message_id: str
    intent: str
    skills: List[str]
    # Add other fields from the actual analysis here

class AnalyzeMessageRequest(BaseModel):
    thread_id: str = Field(..., alias='threadId')
    message_text: str = Field(..., alias='messageText')
    message_id: Optional[str] = Field(None, alias='messageId')
    course_id: str = Field(..., alias='courseId')
    language: Optional[str] = 'en'
    max_history_messages: Optional[int] = Field(10, alias='maxHistoryMessages')
