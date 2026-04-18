export type TagName = string;

export interface TaggedDiff {
  tag: TagName;
  eventName: string;
  version: string;
  field: string;
  changeType: 'added' | 'removed' | 'changed';
}

export interface TagIndex {
  [tag: string]: TaggedDiff[];
}

export function tagDiffEntry(
  eventName: string,
  version: string,
  field: string,
  changeType: TaggedDiff['changeType'],
  tags: TagName[]
): TaggedDiff[] {
  return tags.map((tag) => ({ tag, eventName, version, field, changeType }));
}

export function buildTagIndex(entries: TaggedDiff[]): TagIndex {
  const index: TagIndex = {};
  for (const entry of entries) {
    if (!index[entry.tag]) index[entry.tag] = [];
    index[entry.tag].push(entry);
  }
  return index;
}

export function filterByTag(entries: TaggedDiff[], tag: TagName): TaggedDiff[] {
  return entries.filter((e) => e.tag === tag);
}

export function formatTagSummary(index: TagIndex): string {
  const lines: string[] = [];
  for (const [tag, entries] of Object.entries(index)) {
    lines.push(`[${tag}] ${entries.length} change(s)`);
    for (const e of entries) {
      lines.push(`  ${e.changeType.padEnd(8)} ${e.eventName} → ${e.field} (${e.version})`);
    }
  }
  return lines.join('\n');
}
