import { DiffEntry } from './diffSchema';
import { createHash } from 'crypto';

export interface DiffSignature {
  hash: string;
  version: string;
  eventCount: number;
  changeCount: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

export function computeSignature(
  diffs: Record<string, DiffEntry[]>,
  versionA: string,
  versionB: string
): DiffSignature {
  const allEntries = Object.values(diffs).flat();
  const addedCount = allEntries.filter(e => e.type === 'added').length;
  const removedCount = allEntries.filter(e => e.type === 'removed').length;
  const modifiedCount = allEntries.filter(e => e.type === 'changed').length;
  const changeCount = allEntries.length;
  const eventCount = Object.keys(diffs).length;

  const fingerprint = allEntries
    .map(e => `${e.type}:${e.field}:${e.before ?? ''}:${e.after ?? ''}`)
    .sort()
    .join('|');

  const hash = createHash('sha256')
    .update(`${versionA}:${versionB}:${fingerprint}`)
    .digest('hex')
    .slice(0, 12);

  return {
    hash,
    version: `${versionA}..${versionB}`,
    eventCount,
    changeCount,
    addedCount,
    removedCount,
    modifiedCount,
  };
}

export function formatSignature(sig: DiffSignature): string {
  const lines = [
    `Diff Signature: ${sig.hash}`,
    `Version Range:  ${sig.version}`,
    `Events:         ${sig.eventCount}`,
    `Total Changes:  ${sig.changeCount}`,
    `  Added:        ${sig.addedCount}`,
    `  Removed:      ${sig.removedCount}`,
    `  Modified:     ${sig.modifiedCount}`,
  ];
  return lines.join('\n');
}

export function formatSignatureJson(sig: DiffSignature): string {
  return JSON.stringify(sig, null, 2);
}
