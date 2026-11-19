from fastapi import APIRouter
from app.api.voice_assistant.router import router as voice_assistant_router

api_router = APIRouter()
api_router.include_router(voice_assistant_router)
