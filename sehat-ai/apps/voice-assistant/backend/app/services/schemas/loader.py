
import json
from functools import lru_cache
from pathlib import Path

SCHEMAS_ROOT = Path(__file__).resolve().parents[4] / "assets" / "schemas"

SCHEMA_REGISTRY = {
    ("patient_registration", "personal_details"):
        "patient_registration/personal_details.json",
    ("patient_registration", "sociodemographic_details"):
        "patient_registration/socioeconomic_details.json",
}


@lru_cache(maxsize=64)
def load_form_schema(form_id: str, section_id: str) -> dict:
    schema_path = SCHEMA_REGISTRY.get((form_id, section_id))

    if schema_path is None:
        raise ValueError(
            f"Unsupported form or section: {form_id}/{section_id}"
        )

    file_path = SCHEMAS_ROOT / schema_path

    with file_path.open("r", encoding="utf-8") as file:
        schema = json.load(file)

    if (
        schema.get("form_id") != form_id
        or schema.get("section_id") != section_id
    ):
        raise ValueError("Schema identifiers do not match")

    if not isinstance(schema.get("fields"), list):
        raise ValueError("Invalid schema: fields must be a list")

    return schema
