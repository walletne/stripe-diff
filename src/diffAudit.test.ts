import { buildAuditReport, formatAuditReport, formatAuditJson } from './diffAudit';
import { DiffEntry } from './diffSchema';

function makeEntry(overrides: Partial<DiffEntry> = {}): DiffEntry {
  return {
    event: 'payment_intent.created',
    field: 'data.object.amount',
    change: 'changed',
    oldType: 'integer',
    newType: 'string',
    ...overrides,
  };
}

describe('buildAuditReport', () => {
  it('returns report with correct metadata', () => {
    const report = buildAuditReport([makeEntry()], '2023-08-16', '2024-04-10');
    expect(report.fromVersion).toBe('2023-08-16');
    expect(report.toVersion).toBe('2024-04-10');
    expect(report.events).toHaveLength(1);
    expect(report.generatedAt).toBeTruthy();
  });

  it('maps added change correctly', () => {
    const entry = makeEntry({ change: 'added', oldType: undefined, newType: 'boolean' });
    const report = buildAuditReport([entry], 'v1', 'v2');
    const ev = report.events[0];
    expect(ev.changeType).toBe('added');
    expect(ev.action).toBe('field.added');
    expect(ev.details).toContain('boolean');
  });

  it('maps removed change correctly', () => {
    const entry = makeEntry({ change: 'removed', oldType: 'string', newType: undefined });
    const report = buildAuditReport([entry], 'v1', 'v2');
    const ev = report.events[0];
    expect(ev.changeType).toBe('removed');
    expect(ev.details).toContain('string');
  });

  it('maps changed change correctly', () => {
    const report = buildAuditReport([makeEntry()], 'v1', 'v2');
    const ev = report.events[0];
    expect(ev.details).toContain('integer');
    expect(ev.details).toContain('string');
  });

  it('handles empty entries', () => {
    const report = buildAuditReport([], 'v1', 'v2');
    expect(report.events).toHaveLength(0);
  });
});

describe('formatAuditReport', () => {
  it('includes version header', () => {
    const report = buildAuditReport([makeEntry()], '2023-08-16', '2024-04-10');
    const text = formatAuditReport(report);
    expect(text).toContain('2023-08-16');
    expect(text).toContain('2024-04-10');
    expect(text).toContain('Total events: 1');
  });

  it('includes field path and event name', () => {
    const report = buildAuditReport([makeEntry()], 'v1', 'v2');
    const text = formatAuditReport(report);
    expect(text).toContain('payment_intent.created');
    expect(text).toContain('data.object.amount');
  });
});

describe('formatAuditJson', () => {
  it('returns valid JSON', () => {
    const report = buildAuditReport([makeEntry()], 'v1', 'v2');
    const json = formatAuditJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.fromVersion).toBe('v1');
  });
});
