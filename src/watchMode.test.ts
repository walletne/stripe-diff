import { formatWatchOutput, startWatch, WatchOptions } from './watchMode';
import * as cachedFetchModule from './cachedFetch';
import * as parseSchemaModule from './parseSchema';
import * as diffSchemaModule from './diffSchema';

jest.mock('./cachedFetch');
jest.mock('./parseSchema');
jest.mock('./diffSchema');
jest.mock('./formatDiff', () => ({ formatDiff: () => 'formatted diff' }));

const mockCachedFetch = cachedFetchModule.cachedFetch as jest.Mock;
const mockParseSchema = parseSchemaModule.parseSchema as jest.Mock;
const mockDiff = diffSchemaModule.diffEventSchemas as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  mockCachedFetch.mockResolvedValue({});
  mockParseSchema.mockReturnValue({});
  mockDiff.mockReturnValue([]);
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('startWatch', () => {
  it('calls onDiff immediately on start', async () => {
    const onDiff = jest.fn();
    const handle = await startWatch({ versionA: '2023-01-01', versionB: '2024-01-01', onDiff });
    expect(onDiff).toHaveBeenCalledTimes(1);
    handle.stop();
  });

  it('does not call onDiff again if schema unchanged', async () => {
    const onDiff = jest.fn();
    const handle = await startWatch({ versionA: '2023-01-01', versionB: '2024-01-01', intervalMs: 1000, onDiff });
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    expect(onDiff).toHaveBeenCalledTimes(1);
    handle.stop();
  });

  it('calls onDiff again when diff changes', async () => {
    const onDiff = jest.fn();
    mockDiff.mockReturnValueOnce([]).mockReturnValueOnce([{ event: 'charge.updated', changes: [] }]);
    const handle = await startWatch({ versionA: '2023-01-01', versionB: '2024-01-01', intervalMs: 1000, onDiff });
    jest.advanceTimersByTime(1100);
    await Promise.resolve();
    expect(onDiff).toHaveBeenCalledTimes(2);
    handle.stop();
  });

  it('calls onError on failure', async () => {
    mockCachedFetch.mockRejectedValueOnce(new Error('network'));
    const onDiff = jest.fn();
    const onError = jest.fn();
    const handle = await startWatch({ versionA: 'a', versionB: 'b', onDiff, onError });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    handle.stop();
  });

  it('stop() prevents further polling', async () => {
    const onDiff = jest.fn();
    const handle = await startWatch({ versionA: 'a', versionB: 'b', intervalMs: 500, onDiff });
    handle.stop();
    expect(handle.isRunning()).toBe(false);
  });
});

describe('formatWatchOutput', () => {
  it('shows no changes message when diff is empty', () => {
    const out = formatWatchOutput([], new Date('2024-01-01T00:00:00Z'));
    expect(out).toContain('No changes detected.');
    expect(out).toContain('2024-01-01T00:00:00.000Z');
  });

  it('shows formatted diff when changes exist', () => {
    const out = formatWatchOutput([{ event: 'charge.updated', changes: [] }] as any, new Date('2024-01-01T00:00:00Z'));
    expect(out).toContain('formatted diff');
  });
});
