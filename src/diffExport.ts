import { EventDiff } from './diffSchema';
import { formatDiff } from './formatDiff';
import * as fs from 'fs';
import * as path from 'path';

export interface DiffExportOptions {
  version1: string;
  version2: string;
  diffs: Record<string, EventDiff>;
  format: 'json' | 'markdown' | 'text';
  outputPath?: string;
}

export function exportDiffToJson(options: DiffExportOptions): string {
  const { version1, version2, diffs } = options;
  const payload = {
    generatedAt: new Date().toISOString(),
    version1,
    version2,
    events: Object.fromEntries(
      Object.entries(diffs).map(([event, diff]) => [
        event,
        {
          added: diff.added,
          removed: diff.removed,
          changed: diff.changed,
        },
      ])
    ),
  };
  return JSON.stringify(payload, null, 2);
}

export function exportDiffToMarkdown(options: DiffExportOptions): string {
  const { version1, version2, diffs } = options;
  const lines: string[] = [
    `# Stripe Diff: ${version1} → ${version2}`,
    ``,
    `_Generated at ${new Date().toISOString()}_`,
    ``,
  ];
  for (const [event, diff] of Object.entries(diffs)) {
    lines.push(`## ${event}`);
    lines.push('');
    const text = formatDiff(event, diff);
    lines.push('```');
    lines.push(text);
    lines.push('```');
    lines.push('');
  }
  return lines.join('\n');
}

export function exportDiff(options: DiffExportOptions): string {
  let content: string;
  if (options.format === 'json') {
    content = exportDiffToJson(options);
  } else if (options.format === 'markdown') {
    content = exportDiffToMarkdown(options);
  } else {
    content = Object.entries(options.diffs)
      .map(([event, diff]) => formatDiff(event, diff))
      .join('\n');
  }
  if (options.outputPath) {
    const resolved = path.resolve(options.outputPath);
    fs.writeFileSync(resolved, content, 'utf-8');
  }
  return content;
}
