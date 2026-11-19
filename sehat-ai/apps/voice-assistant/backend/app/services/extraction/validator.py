
import re
from datetime import date
from typing import Any


def validate_field(
    field: dict[str, Any],
    value: Any,
) -> tuple[Any, str | None]:
    """
    Validate a value using its schema metadata.

    Returns:
        (normalized_value, error_message)
    """

    rules = field.get("validation") or {}

    if value is None or value == "":
        return value, None

    normalized = value

    # Normalize digits where explicitly configured.
    if rules.get("normalize") == "remove_non_digits":
        normalized = re.sub(r"\D", "", str(value))

    # Exact digit count.
    if "digits_exactly" in rules:
        expected = rules["digits_exactly"]

        if not (
            isinstance(normalized, str)
            and normalized.isascii()
            and normalized.isdigit()
            and len(normalized) == expected
        ):
            return normalized, (
                f"Must contain exactly {expected} digits."
            )

    # Minimum and maximum string length.
    if "min_length" in rules:
        if len(str(normalized)) < rules["min_length"]:
            return normalized, (
                f"Minimum {rules['min_length']} characters required."
            )

    if "max_length" in rules:
        if len(str(normalized)) > rules["max_length"]:
            return normalized, (
                f"Maximum {rules['max_length']} characters allowed."
            )

    # Frontend regex.
    if "frontend_regex" in rules:
        if not re.fullmatch(
            rules["frontend_regex"],
            str(normalized),
        ):
            return normalized, "Invalid field format."

    # Backend regex.
    if "backend_regex" in rules:
        if not re.fullmatch(
            rules["backend_regex"],
            str(normalized),
        ):
            return normalized, "Invalid field format."

    # Backend exact length.
    if "backend_exact_length" in rules:
        expected = rules["backend_exact_length"]

        if len(str(normalized)) != expected:
            return normalized, (
                f"Must contain exactly {expected} characters."
            )

    # Date validation.
    if field.get("type") == "date":
        try:
            parsed = date.fromisoformat(str(normalized))
        except ValueError:
            return normalized, "Invalid date. Use YYYY-MM-DD."

        if parsed.isoformat() != str(normalized):
            return normalized, "Date must use YYYY-MM-DD."

        if parsed > date.today():
            return normalized, "Date cannot be in the future."

    return normalized, None
