import { buildBlameReport, formatBlameReport, formatBlameJson } from './diffBlame';
import { DiffEntry } from './diffSchema';

const ALL_VERSIONS = ['2022-01-01', '2022-06-01', '2023-01-01', '2023-08-01'];

function makeEntry(overrides: Partial<DiffEntry> = {}): DiffEntry {
  return {
    field: 'data.object.amount',
    changeType: 'changed',
    oldType: 'integer',
    newType: 'number',
    oldRequired: false,
    newRequired: true,
    ...overrides,
  };
}

describe('buildBlameReport', () => {
  it('returns empty entries when no changes', () => {
    const report = buildBlameReport('charge.updated', [], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    expect(report.entries).toHaveLength(0);
    expect(report.event).toBe('charge.updated');
  });

  it('sets introducedIn to newVersion for added fields', () => {
    const entry = makeEntry({ changeType: 'added', newType: 'string', oldType: undefined });
    const report = buildBlameReport('charge.updated', [entry], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    expect(report.entries[0].introducedIn).toBe('2023-01-01');
    expect(report.entries[0].lastSeenIn).toBeUndefined();
  });

  it('sets lastSeenIn to oldVersion for removed fields', () => {
    const entry = makeEntry({ changeType: 'removed', oldType: 'string', newType: undefined });
    const report = buildBlameReport('charge.updated', [entry], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    expect(report.entries[0].lastSeenIn).toBe('2022-01-01');
    expect(report.entries[0].introducedIn).toBe('2022-01-01');
  });

  it('computes ageVersions based on version index distance', () => {
    const entry = makeEntry();
    const report = buildBlameReport('charge.updated', [entry], '2022-01-01', '2023-08-01', ALL_VERSIONS);
    expect(report.entries[0].ageVersions).toBe(3);
  });

  it('handles unknown versions gracefully with ageVersions 0', () => {
    const entry = makeEntry();
    const report = buildBlameReport('charge.updated', [entry], 'unknown', '2023-01-01', ALL_VERSIONS);
    expect(report.entries[0].ageVersions).toBe(0);
  });
});

describe('formatBlameReport', () => {
  it('includes header with event name and versions', () => {
    const report = buildBlameReport('charge.updated', [], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    const output = formatBlameReport(report);
    expect(output).toContain('charge.updated');
    expect(output).toContain('2022-01-01');
    expect(output).toContain('2023-01-01');
  });

  it('shows no changes message for empty entries', () => {
    const report = buildBlameReport('charge.updated', [], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    expect(formatBlameReport(report)).toContain('No changes found');
  });

  it('formats added entry with [+] tag', () => {
    const entry = makeEntry({ changeType: 'added', newType: 'string', oldType: undefined });
    const report = buildBlameReport('charge.updated', [entry], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    expect(formatBlameReport(report)).toContain('[+]');
  });
});

describe('formatBlameJson', () => {
  it('returns valid JSON', () => {
    const report = buildBlameReport('charge.updated', [makeEntry()], '2022-01-01', '2023-01-01', ALL_VERSIONS);
    const json = JSON.parse(formatBlameJson(report));
    expect(json.event).toBe('charge.updated');
    expect(Array.isArray(json.entries)).toBe(true);
  });
});
