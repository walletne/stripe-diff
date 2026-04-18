import { buildProfile, formatProfile, formatProfileJson, DiffProfile } from './diffProfile';
import { EventDiff } from './diffSchema';

function makeDiffs(): Record<string, EventDiff> {
  return {
    'charge.updated': {
      added: [{ path: 'data.object.amount', type: 'integer' }],
      removed: [],
      changed: [{ path: 'data.object.status', from: 'string', to: 'enum' }],
    },
    'customer.created': {
      added: [],
      removed: [{ path: 'data.object.legacy', type: 'string' }],
      changed: [],
    },
  };
}

describe('buildProfile', () => {
  it('counts fields across all events', () => {
    const profile = buildProfile('test', ['2023-01-01', '2024-01-01'], makeDiffs());
    expect(profile.name).toBe('test');
    expect(profile.versions).toEqual(['2023-01-01', '2024-01-01']);
    expect(profile.eventCount).toBe(2);
    expect(profile.addedFields).toBe(1);
    expect(profile.removedFields).toBe(1);
    expect(profile.changedFields).toBe(1);
  });

  it('sets createdAt as ISO string', () => {
    const profile = buildProfile('p', ['a', 'b'], {});
    expect(() => new Date(profile.createdAt)).not.toThrow();
  });
});

describe('formatProfile', () => {
  it('includes all fields', () => {
    const profile = buildProfile('my-profile', ['2023-01-01', '2024-01-01'], makeDiffs());
    const output = formatProfile(profile);
    expect(output).toContain('my-profile');
    expect(output).toContain('2023-01-01');
    expect(output).toContain('2024-01-01');
    expect(output).toContain('Added:    1');
    expect(output).toContain('Removed:  1');
  });
});

describe('formatProfileJson', () => {
  it('returns valid JSON', () => {
    const profile = buildProfile('p', ['a', 'b'], makeDiffs());
    const json = JSON.parse(formatProfileJson(profile));
    expect(json.name).toBe('p');
    expect(json.addedFields).toBe(1);
  });
});
