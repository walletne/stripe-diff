import { DiffEntry } from './diffSchema';

export interface FocusOptions {
  fields?: string[];
  depth?: number;
  events?: string[];
}

export interface FocusResult {
  event: string;
  field: string;
  change: DiffEntry;
  depth: number;
}

export function getFieldDepth(field: string): number {
  return field.split('.').length;
}

export function matchesFocusField(field: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return field === prefix || field.startsWith(prefix + '.');
    }
    return field === pattern || field.startsWith(pattern + '.');
  });
}

export function focusDiff(
  diff: Record<string, Record<string, DiffEntry>>,
  options: FocusOptions
): FocusResult[] {
  const results: FocusResult[] = [];
  const maxDepth = options.depth ?? Infinity;

  for (const [event, fields] of Object.entries(diff)) {
    if (options.events && !options.events.includes(event)) continue;

    for (const [field, change] of Object.entries(fields)) {
      const depth = getFieldDepth(field);
      if (depth > maxDepth) continue;

      if (options.fields && !matchesFocusField(field, options.fields)) continue;

      results.push({ event, field, change, depth });
    }
  }

  return results;
}

export function formatFocusResults(results: FocusResult[]): string {
  if (results.length === 0) return 'No matching fields found.';

  const lines: string[] = [];
  let lastEvent = '';

  for (const { event, field, change, depth } of results) {
    if (event !== lastEvent) {
      lines.push(`\n${event}`);
      lastEvent = event;
    }
    const indent = '  '.repeat(depth - 1);
    const symbol = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
    lines.push(`  ${indent}${symbol} ${field}: ${change.type}`);
  }

  return lines.join('\n').trim();
}

export function formatFocusJson(results: FocusResult[]): string {
  return JSON.stringify(results, null, 2);
}
