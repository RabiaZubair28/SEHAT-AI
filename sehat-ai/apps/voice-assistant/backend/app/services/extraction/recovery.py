
"""Recover explicitly spoken fields omitted during AI extraction.

Does not invent identifiers, location IDs or missing values.
"""

import re
from typing import Any

from app.models.extraction import (
    ExtractedField,
    ExtractionResponse,
    UnresolvedField,
)
from app.services.extraction.extractor import (
    _get_occurrences,
    _match_enum,
    _normalize_date,
    normalize_spoken_digits,
)
from app.services.extraction.validator import validate_field
from app.services.schemas.loader import load_form_schema


_SYMBOL_WORDS = (
    (r"(?:forward\s+slash|slash)", "/"),
    (r"(?:backslash|back\s+slash)", "\\"),
    (r"(?:hyphen|dash)", "-"),
    (r"(?:exclamation\s+(?:mark|point))", "!"),
    (r"(?:question\s+mark)", "?"),
    (r"(?:full\s+stop|period)", "."),
    (r"comma", ","),
    (r"colon", ":"),
    (r"semi\s*colon", ";"),
)


def normalize_address(value: str) -> str:
    """Convert spoken punctuation without adding duplicate commas."""
    value = value.strip()

    for word, sign in _SYMBOL_WORDS:
        value = re.sub(
            rf"\s*,?\s*\b{word}\b\s*,?\s*",
            lambda match: (
                sign if match.start() == 0 else f" {sign} "
            ),
            value,
            flags=re.IGNORECASE,
        )

    value = re.sub(
        r"\s+([,.;:!?/\\])",
        r"\1",
        value,
    )
    value = re.sub(
        r"([/\\-])\s+",
        r"\1",
        value,
    )
    value = re.sub(
        r"(?<=[A-Za-z0-9])\s+-\s*(?=[A-Za-z0-9])",
        "-",
        value,
    )
    value = re.sub(
        r"(?<=[,;:!?])(?=[^\s])",
        " ",
        value,
    )
    value = re.sub(
        r"\s*,\s*,+",
        ",",
        value,
    )
    value = re.sub(
        r"\s{2,}",
        " ",
        value,
    )

    return value.strip(" ,")


def _field_value(
    name: str,
    raw: str,
    schema_field: dict[str, Any],
) -> tuple[Any, bool]:
    field_type = schema_field.get("type")

    if name in {
        "cnic",
        "phone_number",
        "qr_number",
    }:
        digits = normalize_spoken_digits(raw)

        if digits is None:
            return raw.strip(), False

        value, error = validate_field(
            schema_field,
            digits,
        )
        return value, error is None

    if name == "address":
        return normalize_address(raw), True

    if field_type == "date":
        value = _normalize_date(raw)
        value, error = validate_field(
            schema_field,
            value,
        )
        return value, error is None

    if field_type == "enum":
        options = schema_field.get("options") or []

        if name == "blood_group":
            match = re.fullmatch(
                r"(AB|A|B|O)\s*"
                r"(positive|negative|\+ve|-ve|\+|-)",
                raw.strip(),
                re.IGNORECASE,
            )

            if match:
                suffix = (
                    "+ve"
                    if match.group(2).lower()
                    in {"positive", "+ve", "+"}
                    else "-ve"
                )
                raw = (
                    f"{match.group(1).upper()} {suffix}"
                )

        matched = _match_enum(raw, options)

        if matched is None:
            return raw.strip(), False

        return matched, True

    if field_type in {"integer", "number"}:
        if raw.isdecimal():
            return int(raw), True

        return raw.strip(), False

    value, error = validate_field(
        schema_field,
        raw.strip(),
    )
    return value, error is None


def recover_explicit_values(
    response: ExtractionResponse,
) -> ExtractionResponse:
    schema = load_form_schema(
        response.form_id,
        response.section_id,
    )

    fields = {
        field["name"]: field
        for field in schema["fields"]
        if field.get("voice_enabled") is True
        and field.get("type") != "action"
    }

    occurrences = _get_occurrences(
        response.transcript,
        set(fields),
    )

    for name, chunks in occurrences.items():
        if (
            len(chunks) != 1
            or fields[name].get("type") == "reference"
        ):
            continue

        raw = chunks[0]

        value, valid = _field_value(
            name,
            raw,
            fields[name],
        )

        if value is None or value == "":
            continue

        current = response.fields.get(name)

        if current is not None and name != "address":
            continue

        response.fields[name] = ExtractedField(
            value=value,
            raw_value=raw,
            status=(
                "normalized" if valid else "invalid"
            ),
        )

        if name in response.missing_required_fields:
            response.missing_required_fields.remove(name)

        if (
            not valid
            and not any(
                issue.field_name == name
                for issue in response.unresolved
            )
        ):
            response.unresolved.append(
                UnresolvedField(
                    field_name=name,
                    reason="Value needs manual correction",
                    raw_value=raw,
                )
            )

    return response
