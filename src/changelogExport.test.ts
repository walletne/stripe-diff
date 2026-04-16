import { buildChangelogEntry, formatChangelogMarkdown, formatChangelogJson } from './changelogExport';
import { DiffResult } from './diffSchema';

const makeDiff = (event: string, changes: DiffResult['changes'] = []): DiffResult => ({
  event,
  changes,
});

describe('buildChangelogEntry', () => {
  it('builds an entry with metadata', () => {
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', []);
    expect(entry.fromVersion).toBe('2023-08-16');
    expect(entry.toVersion).toBe('2024-04-10');
    expect(entry.events).toEqual([]);
    expect(entry.generatedAt).toBeDefined();
  });

  it('includes provided diffs', () => {
    const diffs = [makeDiff('charge.updated')];
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', diffs);
    expect(entry.events).toHaveLength(1);
    expect(entry.events[0].event).toBe('charge.updated');
  });
});

describe('formatChangelogMarkdown', () => {
  it('returns no changes message when empty', () => {
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', []);
    const md = formatChangelogMarkdown(entry);
    expect(md).toContain('No changes detected.');
  });

  it('includes version header', () => {
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', []);
    const md = formatChangelogMarkdown(entry);
    expect(md).toContain('2023-08-16 → 2024-04-10');
  });

  it('includes event section for each diff', () => {
    const diffs = [makeDiff('invoice.paid', [{ path: 'data.object.amount', type: 'added', newValue: 'integer' }])];
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', diffs);
    const md = formatChangelogMarkdown(entry);
    expect(md).toContain('## invoice.paid');
  });
});

describe('formatChangelogJson', () => {
  it('returns valid JSON', () => {
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', []);
    const json = formatChangelogJson(entry);
    const parsed = JSON.parse(json);
    expect(parsed.fromVersion).toBe('2023-08-16');
  });

  it('is pretty printed', () => {
    const entry = buildChangelogEntry('2023-08-16', '2024-04-10', []);
    const json = formatChangelogJson(entry);
    expect(json).toContain('\n');
  });
});
