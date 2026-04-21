import { DiffEntry } from './diffSchema';

export interface BlameEntry {
  field: string;
  changeType: 'added' | 'removed' | 'changed';
  introducedIn: string;
  lastSeenIn?: string;
  ageVersions: number;
  description: string;
}

export interface BlameReport {
  event: string;
  entries: BlameEntry[];
  oldVersion: string;
  newVersion: string;
}

export function buildBlameReport(
  event: string,
  entries: DiffEntry[],
  oldVersion: string,
  newVersion: string,
  allVersions: string[]
): BlameReport {
  const oldIdx = allVersions.indexOf(oldVersion);
  const newIdx = allVersions.indexOf(newVersion);
  const ageVersions = Math.max(0, newIdx - oldIdx);

  const blameEntries: BlameEntry[] = entries.map((entry) => ({
    field: entry.field,
    changeType: entry.changeType,
    introducedIn: entry.changeType === 'added' ? newVersion : oldVersion,
    lastSeenIn: entry.changeType === 'removed' ? oldVersion : undefined,
    ageVersions,
    description: describeChange(entry),
  }));

  return { event, entries: blameEntries, oldVersion, newVersion };
}

function describeChange(entry: DiffEntry): string {
  if (entry.changeType === 'added') {
    return `Field "${entry.field}" added with type "${entry.newType}"${entry.newRequired ? ' (required)' : ''}`;
  }
  if (entry.changeType === 'removed') {
    return `Field "${entry.field}" removed (was "${entry.oldType}")`;
  }
  const parts: string[] = [];
  if (entry.oldType !== entry.newType) parts.push(`type changed from "${entry.oldType}" to "${entry.newType}"`);
  if (entry.oldRequired !== entry.newRequired)
    parts.push(entry.newRequired ? 'became required' : 'became optional');
  return `Field "${entry.field}": ${parts.join(', ')}`;
}

export function formatBlameReport(report: BlameReport): string {
  const lines: string[] = [
    `Blame report for ${report.event} (${report.oldVersion} → ${report.newVersion})`,
    '='.repeat(60),
  ];
  if (report.entries.length === 0) {
    lines.push('  No changes found.');
    return lines.join('\n');
  }
  for (const entry of report.entries) {
    const tag = entry.changeType === 'added' ? '[+]' : entry.changeType === 'removed' ? '[-]' : '[~]';
    lines.push(`${tag} ${entry.description}`);
    lines.push(`    Introduced in: ${entry.introducedIn}${entry.lastSeenIn ? ` | Last seen in: ${entry.lastSeenIn}` : ''}`);
  }
  return lines.join('\n');
}

export function formatBlameJson(report: BlameReport): string {
  return JSON.stringify(report, null, 2);
}
