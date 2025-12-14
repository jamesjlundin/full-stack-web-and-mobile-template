/**
 * LangSmith sink stub (no-op placeholder)
 *
 * To implement: install langsmith and call the LangSmith client here.
 * This stub exists for future integration without adding external dependencies.
 */

/**
 * Send an observability event to LangSmith
 * Currently a no-op placeholder
 *
 * @param event - Structured event data to send
 */
export function sendToLangsmith(event: Record<string, unknown>): void {
  // No-op placeholder
  // Future implementation:
  // const client = new Client();
  // client.createRun({
  //   name: event.span,
  //   inputs: event,
  //   ...
  // });
  void event;
}
