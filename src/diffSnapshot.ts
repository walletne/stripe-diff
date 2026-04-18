import { EventSchemaDiff } from './diffSchema';
import * as fs from 'fs';
import * as path from 'path';

export interface SnapshotEntry {
  version: string;
  capturedAt: string;
  diff: EventSchemaDiff;
}

export function saveSnapshot(
  snapshotDir: string,
  fromVersion: string,
  toVersion: string,
  diff: EventSchemaDiff
): string {
  const name = `${fromVersion}__${toVersion}.json`;
  const filePath = path.join(snapshotDir, name);
  const entry: SnapshotEntry = {
    version: `${fromVersion}..${toVersion}`,
    capturedAt: new Date().toISOString(),
    diff,
  };
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
  return filePath;
}

export function loadSnapshot(snapshotDir: string, fromVersion: string, toVersion: string): SnapshotEntry | null {
  const name = `${fromVersion}__${toVersion}.json`;
  const filePath = path.join(snapshotDir, name);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SnapshotEntry;
}

export function listSnapshots(snapshotDir: string): string[] {
  if (!fs.existsSync(snapshotDir)) return [];
  return fs.readdirSync(snapshotDir).filter((f) => f.endsWith('.json'));
}

export function formatSnapshotList(snapshots: string[]): string {
  if (snapshots.length === 0) return 'No snapshots found.';
  return snapshots.map((s) => `  • ${s.replace('.json', '').replace('__', ' → ')}`).join('\n');
}
