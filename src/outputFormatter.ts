import { DiffResult } from './diffSchema';
import { formatDiff, formatSummary } from './formatDiff';

export type OutputFormat = 'text' | 'json' | 'markdown';

export function formatOutput(diffs: DiffResult[], format: OutputFormat): string {
  switch (format) {
    case 'json':
      return formatJson(diffs);
    case 'markdown':
      return formatMarkdown(diffs);
    case 'text':
    default:
      return formatText(diffs);
  }
}

function formatText(diffs: DiffResult[]): string {
  if (diffs.length === 0) return 'No differences found.\n';
  const lines: string[] = [];
  for (const diff of diffs) {
    lines.push(formatDiff(diff));
  }
  lines.push(formatSummary(diffs));
  return lines.join('\n');
}

function formatJson(diffs: DiffResult[]): string {
  const output = diffs.map((d) => ({
    event: d.event,
    changes: d.changes.map((c) => ({
      type: c.type,
      path: c.path,
      ...(c.before !== undefined ? { before: c.before } : {}),
      ...(c.after !== undefined ? { after: c.after } : {}),
    })),
  }));
  return JSON.stringify(output, null, 2);
}

function formatMarkdown(diffs: DiffResult[]): string {
  if (diffs.length === 0) return '_No differences found._\n';
  const lines: string[] = ['# Stripe Schema Diff\n'];
  for (const diff of diffs) {
    lines.push(`## ${diff.event}\n`);
    if (diff.changes.length === 0) {
      lines.push('_No changes._\n');
      continue;
    }
    lines.push('| Type | Path | Before | After |');
    lines.push('|------|------|--------|-------|');
    for (const c of diff.changes) {
      const before = c.before !== undefined ? String(c.before) : '';
      const after = c.after !== undefined ? String(c.after) : '';
      lines.push(`| ${c.type} | \`${c.path}\` | ${before} | ${after} |`);
    }
    lines.push('');
  }
  lines.push(`**Total events changed: ${diffs.filter((d) => d.changes.length > 0).length}**\n`);
  return lines.join('\n');
}
