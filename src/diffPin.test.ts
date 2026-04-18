import { pinDiff, unpinDiff, listPins, formatPinTable } from './diffPin';
import * as cache from './cache';

jest.mock('./cache');

const mockRead = cache.readCache as jest.Mock;
const mockWrite = cache.writeCache as jest.Mock;

const makeEntry = (label: string) => ({
  label,
  versions: ['2022-01-01', '2023-01-01'] as [string, string],
  savedAt: '2024-01-01T00:00:00Z',
  summary: { added: 1, removed: 0, changed: 2 },
});

describe('pinDiff', () => {
  it('adds a new pin and writes to cache', () => {
    mockRead.mockReturnValue([]);
    const entry = makeEntry('my-pin');
    pinDiff(entry);
    expect(mockWrite).toHaveBeenCalledWith('pins', [entry]);
  });

  it('replaces existing pin with same label', () => {
    const existing = makeEntry('my-pin');
    mockRead.mockReturnValue([existing]);
    const updated = { ...existing, summary: { added: 5, removed: 0, changed: 0 } };
    pinDiff(updated);
    const written = mockWrite.mock.calls[0][1];
    expect(written).toHaveLength(1);
    expect(written[0].summary.added).toBe(5);
  });
});

describe('unpinDiff', () => {
  it('removes pin by label', () => {
    mockRead.mockReturnValue([makeEntry('keep'), makeEntry('remove')]);
    unpinDiff('remove');
    const written = mockWrite.mock.calls[0][1];
    expect(written).toHaveLength(1);
    expect(written[0].label).toBe('keep');
  });
});

describe('listPins', () => {
  it('returns all pins', () => {
    const pins = [makeEntry('a'), makeEntry('b')];
    mockRead.mockReturnValue(pins);
    expect(listPins()).toHaveLength(2);
  });

  it('returns empty array when no pins', () => {
    mockRead.mockReturnValue(null);
    expect(listPins()).toEqual([]);
  });
});

describe('formatPinTable', () => {
  it('renders table with headers', () => {
    const pins = [makeEntry('release-check')];
    const out = formatPinTable(pins);
    expect(out).toContain('Label');
    expect(out).toContain('release-check');
    expect(out).toContain('2022-01-01');
  });

  it('shows message when no pins', () => {
    expect(formatPinTable([])).toContain('No pinned diffs');
  });
});
