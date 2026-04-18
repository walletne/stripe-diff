import { detectRenames, formatRenameReport } from './diffRename';
import type { DiffEntry } from './diffSchema';

function makeEntries(items: Array<{ type: 'added' | 'removed' | 'changed'; field: string }>): DiffEntry[] {
  return items.map(({ type, field }) => ({
    type,
    field,
    before: type === 'removed' ? 'string' : undefined,
    after: type === 'added' ? 'string' : undefined,
  } as DiffEntry));
}

describe('detectRenames', () => {
  it('detects a simple rename by shared tokens', () => {
    const diffs = {
      'charge.updated': makeEntries([
        { type: 'removed', field: 'data.object.customer_email' },
        { type: 'added', field: 'data.object.customer_email_address' },
      ]),
    };
    const result = detectRenames(diffs, 0.4);
    expect(result['charge.updated'].renames).toHaveLength(1);
    expect(result['charge.updated'].renames[0].oldField).toBe('data.object.customer_email');
    expect(result['charge.updated'].renames[0].newField).toBe('data.object.customer_email_address');
  });

  it('does not match fields below threshold', () => {
    const diffs = {
      'invoice.paid': makeEntries([
        { type: 'removed', field: 'data.object.amount' },
        { type: 'added', field: 'data.object.description' },
      ]),
    };
    const result = detectRenames(diffs, 0.5);
    expect(result['invoice.paid'].renames).toHaveLength(0);
    expect(result['invoice.paid'].unmatched).toContain('data.object.amount');
  });

  it('returns empty renames when no removed fields', () => {
    const diffs = {
      'customer.created': makeEntries([
        { type: 'added', field: 'data.object.phone' },
      ]),
    };
    const result = detectRenames(diffs);
    expect(result['customer.created'].renames).toHaveLength(0);
    expect(result['customer.created'].unmatched).toHaveLength(0);
  });

  it('handles multiple events independently', () => {
    const diffs = {
      'charge.updated': makeEntries([
        { type: 'removed', field: 'data.object.fee' },
        { type: 'added', field: 'data.object.fee_amount' },
      ]),
      'payment_intent.created': makeEntries([
        { type: 'added', field: 'data.object.payment_method' },
      ]),
    };
    const result = detectRenames(diffs, 0.3);
    expect(result['charge.updated'].renames).toHaveLength(1);
    expect(result['payment_intent.created'].renames).toHaveLength(0);
  });
});

describe('formatRenameReport', () => {
  it('formats renames into readable lines', () => {
    const results = {
      'charge.updated': {
        renames: [{ event: 'charge.updated', oldField: 'data.object.fee', newField: 'data.object.fee_amount', similarity: 0.75 }],
        unmatched: [],
      },
    };
    const output = formatRenameReport(results);
    expect(output).toContain('charge.updated');
    expect(output).toContain('data.object.fee → data.object.fee_amount');
    expect(output).toContain('75%');
  });

  it('skips events with no renames', () => {
    const results = {
      'invoice.paid': { renames: [], unmatched: ['data.object.amount'] },
    };
    const output = formatRenameReport(results);
    expect(output).toBe('');
  });
});
