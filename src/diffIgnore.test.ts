import { parseIgnoreFile, matchesIgnoreRule, applyIgnoreRules } from './diffIgnore';

describe('parseIgnoreFile', () => {
  it('parses event rules', () => {
    const rules = parseIgnoreFile('event: payment_intent.created\n');
    expect(rules).toEqual([{ pattern: 'payment_intent.created', type: 'event' }]);
  });

  it('parses field rules', () => {
    const rules = parseIgnoreFile('field: data.object.metadata\n');
    expect(rules).toEqual([{ pattern: 'data.object.metadata', type: 'field' }]);
  });

  it('parses glob rules', () => {
    const rules = parseIgnoreFile('*:livemode\n');
    expect(rules).toEqual([{ pattern: '*:livemode', type: 'glob' }]);
  });

  it('ignores comments and blank lines', () => {
    const rules = parseIgnoreFile('# comment\n\nevent: foo.bar\n');
    expect(rules).toHaveLength(1);
  });
});

describe('matchesIgnoreRule', () => {
  it('matches event rule by name', () => {
    const rule = { pattern: 'charge.updated', type: 'event' as const };
    expect(matchesIgnoreRule(rule, 'charge.updated', 'data.object.amount')).toBe(true);
    expect(matchesIgnoreRule(rule, 'charge.created', 'data.object.amount')).toBe(false);
  });

  it('matches field rule by path', () => {
    const rule = { pattern: 'livemode', type: 'field' as const };
    expect(matchesIgnoreRule(rule, 'any.event', 'livemode')).toBe(true);
    expect(matchesIgnoreRule(rule, 'any.event', 'data.livemode')).toBe(true);
    expect(matchesIgnoreRule(rule, 'any.event', 'data.object.id')).toBe(false);
  });

  it('matches glob rule with wildcard event', () => {
    const rule = { pattern: '*:livemode', type: 'glob' as const };
    expect(matchesIgnoreRule(rule, 'charge.created', 'livemode')).toBe(true);
    expect(matchesIgnoreRule(rule, 'charge.created', 'amount')).toBe(false);
  });
});

describe('applyIgnoreRules', () => {
  it('filters out ignored entries', () => {
    const rules = parseIgnoreFile('field: livemode\n');
    const entries = [
      { event: 'charge.created', field: 'livemode' },
      { event: 'charge.created', field: 'amount' },
    ];
    const result = applyIgnoreRules(rules, entries);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('amount');
  });

  it('returns all entries when no rules match', () => {
    const rules = parseIgnoreFile('event: other.event\n');
    const entries = [{ event: 'charge.created', field: 'amount' }];
    expect(applyIgnoreRules(rules, entries)).toHaveLength(1);
  });
});
