from fastapi import APIRouter
from . import extraction, health, interpretation, schemas, transcription

router = APIRouter(prefix="/api/voice-assistant", tags=["Voice Assistant"])
router.include_router(health.router)
router.include_router(transcription.router)
router.include_router(extraction.router)
router.include_router(schemas.router)
router.include_router(interpretation.router)
