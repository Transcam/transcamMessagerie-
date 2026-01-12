/**
 * Phone number validation utilities for Cameroonian phone numbers
 */

/**
 * Regex pattern for validating Cameroonian phone numbers
 * Format: 9 digits starting with 6 or 2
 * - First digit: 6 or 2
 * - Second digit: 2, 3, or 5-9
 * - Remaining 7 digits: 0-9
 */
export const CAMEROON_PHONE_REGEX = /(6|2)(2|3|[5-9])[0-9]{7}/;

/**
 * Error message for invalid phone number format
 */
export const PHONE_VALIDATION_ERROR_MESSAGE =
  "Phone number must be a valid Cameroonian number (9 digits starting with 6 or 2)";

/**
 * Validates if a phone number matches the Cameroonian format
 * @param phone - The phone number to validate
 * @returns true if the phone number is valid, false otherwise
 */
export function isValidCameroonPhone(phone: string): boolean {
  return CAMEROON_PHONE_REGEX.test(phone);
}
