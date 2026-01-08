/**
 * Utility functions for handling offline queue errors
 */

export interface QueuedRequestError {
  isQueued: boolean;
  queueId?: string;
  message: string;
}

/**
 * Check if an error is a queued request error
 */
export function isQueuedRequestError(
  error: unknown
): error is QueuedRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isQueued" in error &&
    (error as QueuedRequestError).isQueued === true
  );
}

/**
 * Get user-friendly message for queued request
 */
export function getQueuedRequestMessage(language: "fr" | "en" = "en"): string {
  return language === "fr"
    ? "Requête en attente - sera envoyée une fois en ligne"
    : "Request queued - will be sent when online";
}
