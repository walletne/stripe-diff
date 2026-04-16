/**
 * Filter and match Stripe webhook event types using glob-style patterns.
 */

export function matchesPattern(eventType: string, pattern: string): boolean {
  if (pattern === '*') return true;
  const escaped = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(eventType);
}

export function filterEvents(
  eventTypes: string[],
  patterns: string[]
): string[] {
  if (patterns.length === 0) return eventTypes;
  return eventTypes.filter((eventType) =>
    patterns.some((pattern) => matchesPattern(eventType, pattern))
  );
}

export function parseEventPatterns(input: string): string[] {
  return input
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function groupEventsByObject(
  eventTypes: string[]
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const eventType of eventTypes) {
    const parts = eventType.split('.');
    const object = parts[0] ?? 'unknown';
    if (!groups[object]) groups[object] = [];
    groups[object].push(eventType);
  }
  return groups;
}
