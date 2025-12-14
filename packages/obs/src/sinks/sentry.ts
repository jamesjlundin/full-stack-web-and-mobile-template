/**
 * Sentry sink stub (no-op placeholder)
 *
 * To implement: install @sentry/node and call Sentry.captureEvent() here.
 * This stub exists for future integration without adding external dependencies.
 */

/**
 * Send an observability event to Sentry
 * Currently a no-op placeholder
 *
 * @param event - Structured event data to send
 */
export function sendToSentry(event: Record<string, unknown>): void {
  // No-op placeholder
  // Future implementation:
  // Sentry.captureEvent({
  //   message: event.span,
  //   extra: event,
  //   level: event.error ? 'error' : 'info',
  // });
  void event;
}
