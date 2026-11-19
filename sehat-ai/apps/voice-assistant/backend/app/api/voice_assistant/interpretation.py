"""Opt-in local pilot: audio in, reviewed AI field proposals out."""

import logging
import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.api.voice_assistant.transcription import (
    ALLOWED_CONTENT_TYPES,
    MAX_AUDIO_BYTES,
    get_stt_provider,
)
from app.models.extraction import ExtractionResponse
from app.services.extraction.ai_interpreter import interpret_transcript
from app.services.schemas.loader import load_form_schema

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/interpret", response_model=ExtractionResponse)
async def interpret_audio(
    file: UploadFile = File(...),
    form_id: str = Form(...),
    section_id: str = Form(...),
) -> ExtractionResponse:
    # Not exposed by default. Add EMR session auth before production rollout.
    if os.getenv("SEHAT_INTERPRET_ENABLED") != "1":
        raise HTTPException(status_code=404, detail="Pilot is disabled.")

    try:
        load_form_schema(form_id, section_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Unknown form section.") from exc

    mime = (file.content_type or "").split(";", 1)[0].strip().lower()
    try:
        if mime not in ALLOWED_CONTENT_TYPES or mime == "application/octet-stream":
            raise HTTPException(status_code=415, detail="Unsupported audio type.")
        audio = await file.read(MAX_AUDIO_BYTES + 1)
        if not audio:
            raise HTTPException(status_code=400, detail="Audio is empty.")
        if len(audio) > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail="Audio is too large.")

        stt = get_stt_provider()
        transcription = await stt.transcribe(
            audio=audio, filename=file.filename or "recording", content_type=mime
        )
        text = transcription.text.strip()
        if not text:
            raise HTTPException(status_code=422, detail="No speech recognized.")
        if len(text) > 5000:
            raise HTTPException(status_code=422, detail="Recording is too long.")

        # Ollama's HTTP client is synchronous, so keep it off the event loop.
        return await run_in_threadpool(
            interpret_transcript, text, form_id, section_id, transcription.language
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Voice interpretation failed")
        raise HTTPException(
            status_code=503, detail="Voice interpretation is unavailable."
        ) from exc
    finally:
        await file.close()
