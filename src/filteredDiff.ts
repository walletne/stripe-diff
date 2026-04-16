import { diffEventSchemas, type EventDiff } from './diffSchema';
import { filterEvents, parseEventPatterns } from './eventFilter';
import type { EventSchemas } from './parseSchema';

export interface FilteredDiffOptions {
  eventPatterns?: string;
  includeUnchanged?: boolean;
}

export interface FilteredDiffResult {
  diffs: Record<string, EventDiff>;
  filteredCount: number;
  totalCount: number;
  matchedEvents: string[];
}

export function filteredDiff(
  schemasA: EventSchemas,
  schemasB: EventSchemas,
  options: FilteredDiffOptions = {}
): FilteredDiffResult {
  const allEvents = Array.from(
    new Set([...Object.keys(schemasA), ...Object.keys(schemasB)])
  ).sort();

  const patterns = options.eventPatterns
    ? parseEventPatterns(options.eventPatterns)
    : [];

  const matchedEvents = filterEvents(allEvents, patterns);

  const filteredA: EventSchemas = {};
  const filteredB: EventSchemas = {};
  for (const event of matchedEvents) {
    if (schemasA[event]) filteredA[event] = schemasA[event];
    if (schemasB[event]) filteredB[event] = schemasB[event];
  }

  const allDiffs = diffEventSchemas(filteredA, filteredB);

  const diffs: Record<string, EventDiff> = {};
  for (const [event, diff] of Object.entries(allDiffs)) {
    const hasChanges =
      diff.added.length > 0 ||
      diff.removed.length > 0 ||
      diff.changed.length > 0;
    if (options.includeUnchanged || hasChanges) {
      diffs[event] = diff;
    }
  }

  return {
    diffs,
    filteredCount: matchedEvents.length,
    totalCount: allEvents.length,
    matchedEvents,
  };
}
