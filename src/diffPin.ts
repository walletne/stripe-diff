import { readCache, writeCache } from './cache';

export interface PinnedDiff {
  id: string;
  label: string;
  fromVersion: string;
  toVersion: string;
  eventType?: string;
  createdAt: string;
}

const PIN_CACHE_KEY = 'pinned-diffs';

export async function listPins(): Promise<PinnedDiff[]> {
  const pins = await readCache<PinnedDiff[]>(PIN_CACHE_KEY);
  return pins ?? [];
}

export async function addPin(pin: Omit<PinnedDiff, 'id' | 'createdAt'>): Promise<PinnedDiff> {
  const pins = await listPins();
  const newPin: PinnedDiff = {
    ...pin,
    id: `pin_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  pins.push(newPin);
  await writeCache(PIN_CACHE_KEY, pins);
  return newPin;
}

export async function removePin(id: string): Promise<boolean> {
  const pins = await listPins();
  const filtered = pins.filter((p) => p.id !== id);
  if (filtered.length === pins.length) return false;
  await writeCache(PIN_CACHE_KEY, filtered);
  return true;
}

export async function findPin(id: string): Promise<PinnedDiff | undefined> {
  const pins = await listPins();
  return pins.find((p) => p.id === id);
}

export function formatPinTable(pins: PinnedDiff[]): string {
  if (pins.length === 0) return 'No pinned diffs.';
  const header = 'ID                  | Label              | From       | To         | Event';
  const sep = '-'.repeat(header.length);
  const rows = pins.map((p) =>
    [
      p.id.padEnd(20),
      (p.label ?? '').padEnd(20),
      p.fromVersion.padEnd(12),
      p.toVersion.padEnd(12),
      p.eventType ?? '*',
    ].join('| ')
  );
  return [header, sep, ...rows].join('\n');
}
