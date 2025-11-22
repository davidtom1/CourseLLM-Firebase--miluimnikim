from fastapi import FastAPI, APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models
from .llm_client import call_llm_for_analysis
from .analysis_mapper import map_llm_response_to_message_analysis
from .database import get_db, save_analysis_to_db, load_recent_messages, load_student_profile, load_graph_snippet
import time

app = FastAPI()
router = APIRouter()

def get_current_user():
    # In a real app, this would be implemented to get the current authenticated user
    # For now, we'll just return a dummy user ID.
    return "test_user_id"


@router.post("/analyze-message", response_model=models.Analysis)
def analyze_message(data: models.AnalyzeMessageRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    thread_id = data.thread_id
    message_text = data.message_text
    message_id = data.message_id or f"analysis-{int(time.time() * 1000)}"
    course_id = data.course_id
    language = data.language
    max_history_messages = data.max_history_messages

    try:
        recent_messages = load_recent_messages(db, thread_id, max_history_messages)
        student_profile = load_student_profile(db, user_id)
        graph_snippet = load_graph_snippet(db, course_id)

        llm_input = {
            "messageText": message_text,
            "recentMessages": recent_messages,
            "studentProfile": student_profile,
            "graphSnippet": graph_snippet,
            "language": language,
        }

        raw_analysis = call_llm_for_analysis(llm_input)
        analysis = map_llm_response_to_message_analysis(raw_analysis, {
            "uid": user_id,
            "thread_id": thread_id,
            "message_id": message_id,
        })

        save_analysis_to_db(db, thread_id, message_id, analysis)

        return analysis
    except Exception as e:
        # In a real app, you would have more robust logging
        print(f"Error analyzing message: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze message")

app.include_router(router)
