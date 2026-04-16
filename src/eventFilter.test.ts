import { describe, it, expect } from 'vitest';
import {
  matchesPattern,
  filterEvents,
  parseEventPatterns,
  groupEventsByObject,
} from './eventFilter';

const SAMPLE_EVENTS = [
  'charge.created',
  'charge.updated',
  'customer.created',
  'customer.subscription.created',
  'invoice.paid',
  'payment_intent.succeeded',
];

describe('matchesPattern', () => {
  it('matches exact event type', () => {
    expect(matchesPattern('charge.created', 'charge.created')).toBe(true);
  });

  it('does not match different event', () => {
    expect(matchesPattern('charge.updated', 'charge.created')).toBe(false);
  });

  it('matches wildcard *', () => {
    expect(matchesPattern('charge.created', '*')).toBe(true);
  });

  it('matches prefix wildcard charge.*', () => {
    expect(matchesPattern('charge.created', 'charge.*')).toBe(true);
    expect(matchesPattern('invoice.paid', 'charge.*')).toBe(false);
  });

  it('matches nested wildcard', () => {
    expect(matchesPattern('customer.subscription.created', 'customer.*')).toBe(true);
  });
});

describe('filterEvents', () => {
  it('returns all events when no patterns given', () => {
    expect(filterEvents(SAMPLE_EVENTS, [])).toEqual(SAMPLE_EVENTS);
  });

  it('filters by exact pattern', () => {
    expect(filterEvents(SAMPLE_EVENTS, ['invoice.paid'])).toEqual(['invoice.paid']);
  });

  it('filters by wildcard pattern', () => {
    const result = filterEvents(SAMPLE_EVENTS, ['charge.*']);
    expect(result).toEqual(['charge.created', 'charge.updated']);
  });

  it('supports multiple patterns', () => {
    const result = filterEvents(SAMPLE_EVENTS, ['charge.*', 'invoice.paid']);
    expect(result).toContain('charge.created');
    expect(result).toContain('invoice.paid');
    expect(result).not.toContain('customer.created');
  });
});

describe('parseEventPatterns', () => {
  it('parses comma-separated patterns', () => {
    expect(parseEventPatterns('charge.*,invoice.paid')).toEqual(['charge.*', 'invoice.paid']);
  });

  it('trims whitespace', () => {
    expect(parseEventPatterns('charge.* , invoice.paid')).toEqual(['charge.*', 'invoice.paid']);
  });

  it('returns empty array for empty string', () => {
    expect(parseEventPatterns('')).toEqual([]);
  });
});

describe('groupEventsByObject', () => {
  it('groups events by object prefix', () => {
    const groups = groupEventsByObject(SAMPLE_EVENTS);
    expect(groups['charge']).toEqual(['charge.created', 'charge.updated']);
    expect(groups['customer']).toEqual(['customer.created', 'customer.subscription.created']);
    expect(groups['invoice']).toEqual(['invoice.paid']);
  });
});
