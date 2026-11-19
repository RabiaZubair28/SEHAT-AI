
import logging
import os
from functools import lru_cache

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.contracts.transcription import STTProvider
from app.services.transcription.whisper import LocalWhisperSTTProvider


logger = logging.getLogger(__name__)

router = APIRouter()

MAX_AUDIO_BYTES = 10 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
    "video/webm",
    "application/octet-stream",
}


@lru_cache(maxsize=1)
def get_stt_provider() -> STTProvider:
    return LocalWhisperSTTProvider(
        model_size=os.getenv("WHISPER_MODEL_SIZE", "base")
    )


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):

    # Log the original MIME type received from the browser.
    logger.info(
        "Received audio upload: content_type=%r, filename=%r",
        file.content_type,
        file.filename,
    )

    # Normalize MIME type and remove optional codec parameters.
    # Example: audio/webm;codecs=opus -> audio/webm
    content_type = (
        (file.content_type or "")
        .split(";", 1)[0]
        .strip()
        .lower()
    )

    logger.info(
        "Normalized audio content type: %s",
        content_type,
    )

    try:
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=415,
                detail="Unsupported audio format.",
            )

        audio = await file.read(MAX_AUDIO_BYTES + 1)

        if not audio:
            raise HTTPException(
                status_code=400,
                detail="Audio file is empty.",
            )

        if len(audio) > MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Audio file exceeds 10 MB limit.",
            )

        logger.info(
            "Starting voice transcription: size=%d bytes, content_type=%s",
            len(audio),
            content_type,
        )

        provider = get_stt_provider()

        result = await provider.transcribe(
            audio=audio,
            filename=file.filename or "recording",
            content_type=content_type,
        )

        logger.info(
            "Voice transcription completed successfully"
        )

        return {
            "transcript": result.text,
            "detected_language": result.language,
            "provider": "local_whisper",
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("VOICE TRANSCRIPTION ERROR")

        raise HTTPException(
            status_code=500,
            detail="Audio transcription failed.",
        ) from None

    finally:
        await file.close()
