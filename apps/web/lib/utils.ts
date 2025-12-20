import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate and sanitize a redirect URL to prevent open redirect attacks.
 *
 * Only allows relative paths starting with `/`. Rejects:
 * - Absolute URLs (http://, https://, //)
 * - Protocol-relative URLs
 * - JavaScript URLs
 * - Data URLs
 * - Any URL with a different origin
 *
 * @param url - The URL to validate (from query param, etc.)
 * @param fallback - Default URL if invalid (default: "/app/home")
 * @returns Safe redirect URL
 */
export function getSafeRedirectUrl(
  url: string | null | undefined,
  fallback: string = "/app/home"
): string {
  // No URL provided - use fallback
  if (!url || typeof url !== "string") {
    return fallback;
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Empty string - use fallback
  if (!trimmed) {
    return fallback;
  }

  // Must start with a single forward slash (relative path)
  // Reject: //, http://, https://, javascript:, data:, etc.
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Check for dangerous protocols that might be URL-encoded
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:")
  ) {
    return fallback;
  }

  // Valid relative path
  return trimmed;
}
