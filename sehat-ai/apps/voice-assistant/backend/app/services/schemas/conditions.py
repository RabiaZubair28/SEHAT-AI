
from typing import Any


def evaluate_conditions(
    conditions: Any,
    values: dict[str, Any],
) -> bool | None:
    """
    Evaluate schema conditions.

    Returns:
        True  - condition satisfied
        False - condition not satisfied
        None  - required information unavailable
    """

    if conditions is None:
        return True

    if not isinstance(conditions, dict):
        return None

    if not conditions:
        return True

    results: list[bool | None] = []

    for field_name, expected in conditions.items():
        if field_name not in values:
            results.append(None)
            continue

        actual = values[field_name]

        if actual is None or actual == "":
            results.append(None)
            continue

        if isinstance(expected, dict):
            if "not" in expected:
                results.append(
                    actual != expected["not"]
                )

            elif "less_than" in expected:
                try:
                    results.append(
                        float(actual) <
                        float(expected["less_than"])
                    )
                except (TypeError, ValueError):
                    results.append(None)

            else:
                results.append(None)
        else:
            results.append(actual == expected)

    if False in results:
        return False

    if None in results:
        return None

    return True


def is_field_visible(
    field: dict[str, Any],
    values: dict[str, Any],
) -> bool:
    """A field is visible unless its condition is false."""

    condition = field.get("visible_when")

    if condition is None:
        return True

    return evaluate_conditions(condition, values) is not False


def is_field_required(
    field: dict[str, Any],
    values: dict[str, Any],
) -> bool:
    """Evaluate conditional or unconditional requirement."""

    condition = field.get("required_when")

    if condition is not None:
        return evaluate_conditions(condition, values) is True

    return field.get("required") is True
