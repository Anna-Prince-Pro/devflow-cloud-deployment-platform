/**
 * Date and timezone utilities for DevFlow.
 *
 * Guarantees that all UTC timestamps received from the API (with or without 'Z',
 * with explicit offsets, or legacy database records) are safely parsed and
 * rendered in the user's browser local timezone using native Date/Intl APIs.
 *
 * Never hardcodes offsets or assumptions about specific timezones.
 */

/**
 * Safely parses an input value into a valid Date object interpreted as UTC.
 *
 * Handles:
 * - ISO-8601 strings with 'Z' suffix (e.g., "2026-11-22T05:37:34.123Z")
 * - ISO-8601 strings with explicit +/- offset (e.g., "2026-11-22T11:07:34+05:30")
 * - Legacy/naive ISO strings without timezone (e.g., "2026-11-22T05:37:34.123456" or "2026-11-22 05:37:34")
 * - Date objects and numeric epoch timestamps
 * - Returns null for invalid or empty inputs
 */
export function parseUtcDate(value: string | Date | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    let s = value.trim();
    if (!s) return null;

    // Replace space between date and time with 'T' if present (e.g. "2026-11-22 05:37:34")
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T');
    }

    // Check if the string has a timezone designator:
    // Trailing 'Z'/'z' or +/- offset such as '+05:30', '+0530', '-04:00', '+05'
    const hasTimezone = /[Zz]$|[+-]\d{2}(?::?\d{2})?$/.test(s);

    // If it's a date-time string lacking timezone indicator, append 'Z' so JS parses as UTC
    if (!hasTimezone && s.includes('T')) {
      s += 'Z';
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Formats a timestamp into a consistent, readable localized date and time:
 * e.g., "Nov 22, 2026, 11:07 AM"
 */
export function formatDateTime(
  value: string | Date | number | null | undefined,
  fallback: string = '-'
): string {
  const date = parseUtcDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats a timestamp into a consistent, readable localized date:
 * e.g., "Nov 22, 2026"
 */
export function formatDate(
  value: string | Date | number | null | undefined,
  fallback: string = '-'
): string {
  const date = parseUtcDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a timestamp into a localized time:
 * e.g., "11:07 AM"
 */
export function formatTime(
  value: string | Date | number | null | undefined,
  fallback: string = '-'
): string {
  const date = parseUtcDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats a timestamp into relative time ("Just now", "5m ago", "2h ago", "3d ago")
 * with automatic fallback to formatDate for older events.
 */
export function formatRelativeTime(
  value: string | Date | number | null | undefined,
  fallback: string = '-'
): string {
  const date = parseUtcDate(value);
  if (!date) return fallback;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) {
    return 'Just now';
  }
  if (diffSec < 60) {
    return `${Math.max(1, diffSec)}s ago`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatDate(date);
}
