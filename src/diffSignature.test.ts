import { computeSignature, formatSignature, formatSignatureJson } from './diffSignature';
import { DiffEntry } from './diffSchema';

function makeEntry(type: 'added' | 'removed' | 'changed', field: string): DiffEntry {
  return {
    type,
    field,
    before: type !== 'added' ? 'string' : undefined,
    after: type !== 'removed' ? 'string' : undefined,
  };
}

const diffs: Record<string, DiffEntry[]> = {
  'charge.updated': [makeEntry('added', 'data.object.amount'), makeEntry('removed', 'data.object.old_field')],
  'customer.created': [makeEntry('changed', 'data.object.email')],
};

describe('computeSignature', () => {
  it('returns a signature with correct counts', () => {
    const sig = computeSignature(diffs, '2023-01-01', '2024-01-01');
    expect(sig.eventCount).toBe(2);
    expect(sig.changeCount).toBe(3);
    expect(sig.addedCount).toBe(1);
    expect(sig.removedCount).toBe(1);
    expect(sig.modifiedCount).toBe(1);
    expect(sig.version).toBe('2023-01-01..2024-01-01');
    expect(sig.hash).toHaveLength(12);
  });

  it('produces a stable hash for the same input', () => {
    const sig1 = computeSignature(diffs, '2023-01-01', '2024-01-01');
    const sig2 = computeSignature(diffs, '2023-01-01', '2024-01-01');
    expect(sig1.hash).toBe(sig2.hash);
  });

  it('produces different hashes for different inputs', () => {
    const sig1 = computeSignature(diffs, '2023-01-01', '2024-01-01');
    const sig2 = computeSignature({}, '2023-01-01', '2024-01-01');
    expect(sig1.hash).not.toBe(sig2.hash);
  });

  it('handles empty diffs', () => {
    const sig = computeSignature({}, '2023-01-01', '2024-01-01');
    expect(sig.eventCount).toBe(0);
    expect(sig.changeCount).toBe(0);
  });
});

describe('formatSignature', () => {
  it('includes hash and version in output', () => {
    const sig = computeSignature(diffs, '2023-01-01', '2024-01-01');
    const output = formatSignature(sig);
    expect(output).toContain(sig.hash);
    expect(output).toContain('2023-01-01..2024-01-01');
    expect(output).toContain('Total Changes:');
  });
});

describe('formatSignatureJson', () => {
  it('returns valid JSON', () => {
    const sig = computeSignature(diffs, '2023-01-01', '2024-01-01');
    const json = formatSignatureJson(sig);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.hash).toBe(sig.hash);
  });
});
