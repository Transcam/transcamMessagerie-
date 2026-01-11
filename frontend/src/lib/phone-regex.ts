/**
 * Phone number regex pattern for Cameroonian phone numbers
 * Format: (6|2)(2|3|[5-9])[0-9]{7}
 * Examples: 678901234, 232345678, 698765432, 279876543
 */
export const PHONE_REGEX = /^(6|2)(2|3|[5-9])[0-9]{7}$/;

/**
 * Phone number validation error message
 */
export const PHONE_VALIDATION_MESSAGE =
  "Phone number must be 9 digits starting with 6 or 2, followed by 2, 3, or 5-9";
