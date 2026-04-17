import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { computeAllFieldStats, formatFieldStats } from './fieldStats';
import { filterEvents } from './eventFilter';

export interface FieldStatsOptions {
  versionA: string;
  versionB: string;
  events?: string[];
  json?: boolean;
}

export async function runFieldStatsCommand(options: FieldStatsOptions): Promise<string> {
  const [schemaA, schemaB] = await Promise.all([
    cachedFetch(options.versionA),
    cachedFetch(options.versionB),
  ]);

  const eventsA = extractEventSchemas(schemaA);
  const eventsB = extractEventSchemas(schemaB);

  let diffs = diffEventSchemas(eventsA, eventsB);

  if (options.events && options.events.length > 0) {
    diffs = filterEvents(diffs, options.events);
  }

  const stats = computeAllFieldStats(diffs);

  if (options.json) {
    return JSON.stringify(stats, null, 2);
  }

  return formatFieldStats(stats);
}
