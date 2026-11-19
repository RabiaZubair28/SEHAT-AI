
import logging

from fastapi import APIRouter, HTTPException

from app.models.extraction import (
    ExtractionRequest,
    ExtractionResponse,
)
from app.services.extraction.extractor import extract_fields
from app.services.extraction.recovery import recover_explicit_values

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/extract",
    response_model=ExtractionResponse,
)
async def extract_voice_fields(
    request: ExtractionRequest,
) -> ExtractionResponse:
    try:
        result = extract_fields(request)
        return recover_explicit_values(result)

    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Unsupported form or section.",
        )

    except Exception:
        logger.exception(
            "Voice field extraction failed"
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to extract form fields.",
        )
