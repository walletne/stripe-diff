import { DiffResult } from './diffSchema';
import { formatDiff } from './formatDiff';

export interface ChangelogEntry {
  fromVersion: string;
  toVersion: string;
  generatedAt: string;
  events: DiffResult[];
}

export function buildChangelogEntry(
  fromVersion: string,
  toVersion: string,
  diffs: DiffResult[]
): ChangelogEntry {
  return {
    fromVersion,
    toVersion,
    generatedAt: new Date().toISOString(),
    events: diffs,
  };
}

export function formatChangelogMarkdown(entry: ChangelogEntry): string {
  const lines: string[] = [
    `# Stripe API Changelog: ${entry.fromVersion} → ${entry.toVersion}`,
    ``,
    `_Generated at ${entry.generatedAt}_`,
    ``,
  ];

  if (entry.events.length === 0) {
    lines.push('No changes detected.');
    return lines.join('\n');
  }

  for (const diff of entry.events) {
    lines.push(`## ${diff.event}`);
    lines.push('');
    lines.push(formatDiff(diff));
    lines.push('');
  }

  return lines.join('\n');
}

export function formatChangelogJson(entry: ChangelogEntry): string {
  return JSON.stringify(entry, null, 2);
}
