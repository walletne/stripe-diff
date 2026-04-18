import { EventDiff } from './diffSchema';

export interface DiffProfile {
  name: string;
  createdAt: string;
  versions: [string, string];
  eventCount: number;
  addedFields: number;
  removedFields: number;
  changedFields: number;
}

export function buildProfile(name: string, versions: [string, string], diffs: Record<string, EventDiff>): DiffProfile {
  let added = 0, removed = 0, changed = 0;
  for (const diff of Object.values(diffs)) {
    added += diff.added.length;
    removed += diff.removed.length;
    changed += diff.changed.length;
  }
  return {
    name,
    createdAt: new Date().toISOString(),
    versions,
    eventCount: Object.keys(diffs).length,
    addedFields: added,
    removedFields: removed,
    changedFields: changed,
  };
}

export function formatProfile(profile: DiffProfile): string {
  const lines = [
    `Profile: ${profile.name}`,
    `Created:  ${profile.createdAt}`,
    `Versions: ${profile.versions[0]} → ${profile.versions[1]}`,
    `Events:   ${profile.eventCount}`,
    `Added:    ${profile.addedFields}`,
    `Removed:  ${profile.removedFields}`,
    `Changed:  ${profile.changedFields}`,
  ];
  return lines.join('\n');
}

export function formatProfileJson(profile: DiffProfile): string {
  return JSON.stringify(profile, null, 2);
}
