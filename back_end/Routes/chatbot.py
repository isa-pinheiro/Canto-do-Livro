from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from back_end.services.chatbot_service import ChatbotService
from back_end.configs.database import get_db
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chatbot")
def chatbot_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    chatbot = ChatbotService(db)
    response = chatbot.chat(request.message)
    return {"response": response} 