import { formatOutput } from './outputFormatter';
import { DiffResult } from './diffSchema';

function makeDiff(event: string, changes: DiffResult['changes'] = []): DiffResult {
  return { event, changes };
}

describe('formatOutput', () => {
  const diffs: DiffResult[] = [
    makeDiff('payment_intent.created', [
      { type: 'added', path: 'data.object.amount', after: 'integer' },
      { type: 'removed', path: 'data.object.currency', before: 'string' },
      { type: 'changed', path: 'data.object.status', before: 'string', after: 'enum' },
    ]),
  ];

  describe('text format', () => {
    it('returns no differences message when empty', () => {
      expect(formatOutput([], 'text')).toContain('No differences found.');
    });

    it('includes event name', () => {
      expect(formatOutput(diffs, 'text')).toContain('payment_intent.created');
    });
  });

  describe('json format', () => {
    it('returns valid JSON', () => {
      const result = formatOutput(diffs, 'json');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('includes event and changes', () => {
      const result = JSON.parse(formatOutput(diffs, 'json'));
      expect(result[0].event).toBe('payment_intent.created');
      expect(result[0].changes).toHaveLength(3);
    });

    it('returns empty array for no diffs', () => {
      const result = JSON.parse(formatOutput([], 'json'));
      expect(result).toEqual([]);
    });
  });

  describe('markdown format', () => {
    it('returns no differences message when empty', () => {
      expect(formatOutput([], 'markdown')).toContain('No differences found.');
    });

    it('includes markdown table headers', () => {
      const result = formatOutput(diffs, 'markdown');
      expect(result).toContain('| Type | Path | Before | After |');
    });

    it('includes event as heading', () => {
      expect(formatOutput(diffs, 'markdown')).toContain('## payment_intent.created');
    });

    it('includes summary line', () => {
      expect(formatOutput(diffs, 'markdown')).toContain('Total events changed: 1');
    });
  });
});
