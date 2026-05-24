/**
 * Client-side input sanitization utilities
 * Defense-in-depth: strips malicious payloads before they reach the API
 * Server-side Helmet + mongo-sanitize provide the primary protection layer
 */

/**
 * Sanitize general text input
 * - Trims whitespace
 * - Strips HTML tags (prevents XSS via reflected content)
 * - Collapses multiple spaces
 * - Enforces max length
 * @param {string} input - Raw user input
 * @param {number} maxLen - Maximum allowed length (default 2000)
 * @returns {string} Sanitized text
 */
export const sanitizeText = (input, maxLen = 2000) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/&[#\w]+;/g, '')          // Strip HTML entities like &lt; &#x27;
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .substring(0, maxLen);
};

/**
 * Sanitize a URL input
 * - Trims whitespace
 * - Blocks dangerous protocols (javascript:, data:, vbscript:)
 * - Enforces max length
 * @param {string} input - Raw URL string
 * @returns {{ value: string, isValid: boolean }} Sanitized URL + validity flag
 */
export const sanitizeUrl = (input) => {
  if (typeof input !== 'string') return { value: '', isValid: false };

  const trimmed = input.trim().substring(0, 2048);

  // Block dangerous URI schemes
  const dangerous = /^(javascript|data|vbscript|blob):/i;
  if (dangerous.test(trimmed)) {
    return { value: '', isValid: false };
  }

  return { value: trimmed, isValid: trimmed.length > 0 };
};

/**
 * Sanitize an email input
 * - Trims and lowercases
 * - Basic format validation
 * - Enforces max length
 * @param {string} input - Raw email string
 * @returns {{ value: string, isValid: boolean }} Sanitized email + validity flag
 */
export const sanitizeEmail = (input) => {
  if (typeof input !== 'string') return { value: '', isValid: false };

  const trimmed = input.trim().toLowerCase().substring(0, 254);

  // Basic email regex — not exhaustive, server validates too
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailPattern.test(trimmed);

  return { value: trimmed, isValid };
};

/**
 * Sanitize a phone number input
 * - Strips everything except digits and leading +
 * - Enforces max length
 * @param {string} input - Raw phone string
 * @returns {{ value: string, isValid: boolean }} Sanitized phone + validity flag
 */
export const sanitizePhone = (input) => {
  if (typeof input !== 'string') return { value: '', isValid: false };

  // Keep leading + and digits only
  const cleaned = input.trim().replace(/(?!^\+)[^\d]/g, '').substring(0, 20);
  const isValid = cleaned.length >= 7;

  return { value: cleaned, isValid };
};
