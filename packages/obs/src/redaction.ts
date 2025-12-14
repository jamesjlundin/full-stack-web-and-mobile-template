/**
 * Redaction utilities for removing PII and secrets from logged data
 * Patterns are intentionally simple and safe to avoid false negatives
 */

// Email-like pattern: word@word.word
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Phone-like pattern: sequences of digits with optional separators
// Matches common formats like 123-456-7890, (123) 456-7890, +1 234 567 8901
const PHONE_PATTERN =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;

// Long alphanumeric strings (>= 32 chars) that look like secrets/tokens
const SECRET_PATTERN = /\b[A-Za-z0-9]{32,}\b/g;

const REDACTED_EMAIL = "[REDACTED_EMAIL]";
const REDACTED_PHONE = "[REDACTED_PHONE]";
const REDACTED_SECRET = "[REDACTED_SECRET]";

/**
 * Redact PII patterns from a string
 */
function redactString(input: string): string {
  return input
    .replace(EMAIL_PATTERN, REDACTED_EMAIL)
    .replace(PHONE_PATTERN, REDACTED_PHONE)
    .replace(SECRET_PATTERN, REDACTED_SECRET);
}

/**
 * Recursively redact PII from any input value
 * Handles strings, arrays, and objects
 *
 * @param input - Value to redact
 * @returns Redacted copy of the input (original is not mutated)
 */
export function redact(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return redactString(input);
  }

  if (typeof input === "number" || typeof input === "boolean") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redact(item));
  }

  if (typeof input === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = redact(value);
    }
    return result;
  }

  // For other types (functions, symbols, etc.), return undefined
  return undefined;
}
