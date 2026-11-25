"""Datetime utilities for timezone-aware UTC handling across DevFlow."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any


def utc_now() -> datetime:
    """Return the current datetime in UTC (timezone-aware)."""
    return datetime.now(timezone.utc)


def ensure_utc_datetime(v: Any) -> Any:
    """Ensure a datetime object or ISO string is timezone-aware in UTC.

    - If given a naive datetime (e.g. from PostgreSQL or SQLite naive column),
      assumes it represents UTC time and attaches timezone.utc.
    - If given a timezone-aware datetime, converts it to UTC.
    - If given an ISO-8601 string:
        * If missing timezone indicator (no Z, no +/-offset), treats it as UTC.
        * Parses and converts to UTC timezone-aware datetime.
    - Returns None if input is None.
    """
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)
    if isinstance(v, str):
        s = v.strip()
        if not s:
            return None
        # If it contains time and lacks Z or +/- offset, treat as UTC
        if "T" in s and not re.search(r"(?:Z|[+-]\d{2}(?::?\d{2})?)$", s, re.IGNORECASE):
            s += "Z"
        if s.endswith("Z") or s.endswith("z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    return v
