/**
 * Unit tests for frontend date and timezone handling.
 * Run directly via: node --experimental-strip-types src/utils/date.test.mjs
 */

import assert from 'node:assert/strict';
import {
  parseUtcDate,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
} from './date.ts';

console.log('--- Running Frontend Timezone & Date Tests ---');

// Test 1: parseUtcDate handles explicit 'Z' suffix
{
  const input = '2026-11-22T05:37:34.000Z';
  const parsed = parseUtcDate(input);
  assert.ok(parsed instanceof Date, 'Should return a Date instance');
  assert.equal(parsed.toISOString(), '2026-11-22T05:37:34.000Z');
  console.log('✓ parseUtcDate with explicit Z passed');
}

// Test 2: parseUtcDate treats naive ISO strings (without Z) as UTC
{
  const naiveInput = '2026-11-22T05:37:34.000';
  const parsed = parseUtcDate(naiveInput);
  assert.ok(parsed instanceof Date);
  assert.equal(
    parsed.toISOString(),
    '2026-11-22T05:37:34.000Z',
    'Naive ISO string must be parsed as UTC, not local time'
  );
  console.log('✓ parseUtcDate with naive ISO string (database record without Z) passed');
}

// Test 3: parseUtcDate handles space-separated ISO strings
{
  const spaceInput = '2026-11-22 05:37:34';
  const parsed = parseUtcDate(spaceInput);
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.toISOString(), '2026-11-22T05:37:34.000Z');
  console.log('✓ parseUtcDate with space-separated string passed');
}

// Test 4: parseUtcDate handles explicit UTC offsets (+05:30)
{
  const istInput = '2026-11-22T11:07:34.000+05:30';
  const parsed = parseUtcDate(istInput);
  assert.ok(parsed instanceof Date);
  assert.equal(
    parsed.toISOString(),
    '2026-11-22T05:37:34.000Z',
    'Timestamp with +05:30 offset should normalize to 05:37:34Z'
  );
  console.log('✓ parseUtcDate with explicit positive offset passed');
}

// Test 5: parseUtcDate handles explicit negative offsets (-05:00)
{
  const estInput = '2026-11-22T00:37:34.000-05:00';
  const parsed = parseUtcDate(estInput);
  assert.ok(parsed instanceof Date);
  assert.equal(
    parsed.toISOString(),
    '2026-11-22T05:37:34.000Z',
    'Timestamp with -05:00 offset should normalize to 05:37:34Z'
  );
  console.log('✓ parseUtcDate with explicit negative offset passed');
}

// Test 6: Null, undefined, empty, and invalid inputs return null
{
  assert.equal(parseUtcDate(null), null);
  assert.equal(parseUtcDate(undefined), null);
  assert.equal(parseUtcDate(''), null);
  assert.equal(parseUtcDate('   '), null);
  assert.equal(parseUtcDate('not-a-date'), null);
  console.log('✓ parseUtcDate invalid inputs return null safely');
}

// Test 7: formatDateTime produces localized output and respects fallback
{
  const input = '2026-11-22T05:37:34Z';
  const formatted = formatDateTime(input);
  assert.ok(typeof formatted === 'string' && formatted.length > 0);
  assert.equal(formatDateTime(null, 'N/A'), 'N/A');
  assert.equal(formatDateTime('invalid', 'Fallback'), 'Fallback');
  console.log('✓ formatDateTime works and respects fallback');
}

// Test 8: formatDate produces localized date string
{
  const input = '2026-11-22T05:37:34Z';
  const formatted = formatDate(input);
  assert.ok(typeof formatted === 'string' && formatted.length > 0);
  assert.equal(formatDate(null), '-');
  console.log('✓ formatDate works and respects fallback');
}

// Test 9: formatTime produces localized time string
{
  const input = '2026-11-22T05:37:34Z';
  const formatted = formatTime(input);
  assert.ok(typeof formatted === 'string' && formatted.length > 0);
  assert.equal(formatTime(null), '-');
  console.log('✓ formatTime works and respects fallback');
}

// Test 10: formatRelativeTime handles recent, hours, days, and invalid
{
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(fiveMinAgo), '5m ago');
  assert.equal(formatRelativeTime(twoHoursAgo), '2h ago');
  assert.equal(formatRelativeTime(null, 'Unknown'), 'Unknown');
  console.log('✓ formatRelativeTime works as expected');
}

console.log('=== All 10 Frontend Timezone & Date Tests Passed Successfully ===');
