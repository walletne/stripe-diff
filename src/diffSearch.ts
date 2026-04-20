import { FieldDiff } from './diffSchema';

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  searchIn?: ('field' | 'type' | 'description')[];
}

export interface SearchResult {
  eventName: string;
  fieldPath: string;
  change: FieldDiff;
  matchedOn: string;
}

export function searchDiff(
  diffs: Record<string, FieldDiff[]>,
  options: SearchOptions
): SearchResult[] {
  const { query, caseSensitive = false, searchIn = ['field', 'type'] } = options;

  if (!query || query.trim() === '') return [];

  const needle = caseSensitive ? query : query.toLowerCase();
  const results: SearchResult[] = [];

  for (const [eventName, changes] of Object.entries(diffs)) {
    for (const change of changes) {
      let matchedOn: string | null = null;

      const check = (value: string, label: string) => {
        const haystack = caseSensitive ? value : value.toLowerCase();
        if (haystack.includes(needle)) matchedOn = label;
      };

      if (searchIn.includes('field')) check(change.field, 'field');
      if (searchIn.includes('type')) {
        if (change.oldType) check(change.oldType, 'type');
        if (change.newType) check(change.newType, 'type');
      }

      if (matchedOn) {
        results.push({ eventName, fieldPath: change.field, change, matchedOn });
      }
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No matches found.\n';
  const lines: string[] = [`Found ${results.length} match(es):\n`];
  for (const r of results) {
    lines.push(`  [${r.eventName}] ${r.fieldPath} (matched on: ${r.matchedOn})`);
    if (r.change.oldType || r.change.newType) {
      lines.push(`    type: ${r.change.oldType ?? '—'} → ${r.change.newType ?? '—'}`);
    }
  }
  return lines.join('\n') + '\n';
}
