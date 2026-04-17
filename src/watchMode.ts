import { cachedFetch } from './cachedFetch';
import { parseSchema } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { formatDiff } from './formatDiff';
import { EventDiff } from './filteredDiff';

export interface WatchOptions {
  versionA: string;
  versionB: string;
  intervalMs?: number;
  onDiff: (diff: EventDiff[], timestamp: Date) => void;
  onError?: (err: Error) => void;
}

export interface WatchHandle {
  stop: () => void;
  isRunning: () => boolean;
}

export async function startWatch(options: WatchOptions): Promise<WatchHandle> {
  const { versionA, versionB, intervalMs = 60_000, onDiff, onError } = options;
  let running = true;
  let lastSnapshot: string | null = null;

  async function poll() {
    try {
      const [schemaA, schemaB] = await Promise.all([
        cachedFetch(versionA),
        cachedFetch(versionB),
      ]);
      const eventsA = parseSchema(schemaA);
      const eventsB = parseSchema(schemaB);
      const diff = diffEventSchemas(eventsA, eventsB);
      const snapshot = JSON.stringify(diff);

      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        onDiff(diff, new Date());
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  await poll();
  const timer = setInterval(() => {
    if (running) poll();
  }, intervalMs);

  return {
    stop: () => {
      running = false;
      clearInterval(timer);
    },
    isRunning: () => running,
  };
}

export function formatWatchOutput(diff: EventDiff[], timestamp: Date): string {
  const header = `[${timestamp.toISOString()}] Stripe schema diff update`;
  const body = diff.length === 0 ? 'No changes detected.' : formatDiff(diff);
  return `${header}\n${body}`;
}
