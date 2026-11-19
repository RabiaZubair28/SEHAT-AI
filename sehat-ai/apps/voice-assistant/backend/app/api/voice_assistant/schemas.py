
import logging

from fastapi import APIRouter, HTTPException

from app.services.schemas.loader import load_form_schema


logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/schemas/{form_id}/{section_id}")
async def get_form_schema(form_id: str, section_id: str):
    try:
        return load_form_schema(form_id, section_id)

    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Form or section schema not found.",
        )

    except FileNotFoundError:
        logger.exception("Schema file missing")

        raise HTTPException(
            status_code=500,
            detail="Schema configuration is unavailable.",
        )

    except Exception:
        logger.exception("Unexpected schema loading failure")

        raise HTTPException(
            status_code=500,
            detail="Unable to load form schema.",
        )
