
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


# --------------------------------------------------
# Extraction Request
# --------------------------------------------------

class ExtractionRequest(BaseModel):
    form_id: str = Field(
        min_length=1,
        max_length=100,
    )

    section_id: str = Field(
        min_length=1,
        max_length=100,
    )

    transcript: str = Field(
        min_length=1,
        max_length=5000,
    )

    @field_validator("transcript")
    @classmethod
    def validate_transcript(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Transcript cannot be empty")

        return value


# --------------------------------------------------
# Common Field Statuses
# --------------------------------------------------

FieldStatus = Literal[
    "extracted",
    "normalized",
    "invalid",
    "unresolved",
]

ReferenceStatus = Literal[
    "pending_resolution",
    "resolved",
    "ambiguous",
    "not_found",
]


# --------------------------------------------------
# Extracted Field Models
# --------------------------------------------------

class ExtractedField(BaseModel):
    value: Any = None
    raw_value: str | None = None
    status: FieldStatus = "extracted"


class ExtractedReference(BaseModel):
    spoken_label: str
    resolved_id: str | int | None = None
    status: ReferenceStatus = "pending_resolution"


class UnresolvedField(BaseModel):
    field_name: str
    reason: str
    raw_value: str | None = None


# --------------------------------------------------
# Generic Extraction Response
# --------------------------------------------------

class ExtractionResponse(BaseModel):
    schema_version: str
    form_id: str
    section_id: str
    transcript: str
    detected_language: str | None = None

    fields: dict[str, ExtractedField] = Field(
        default_factory=dict
    )

    references: dict[str, ExtractedReference] = Field(
        default_factory=dict
    )

    unresolved: list[UnresolvedField] = Field(
        default_factory=list
    )

    missing_required_fields: list[str] = Field(
        default_factory=list
    )

    requires_review: bool = True
