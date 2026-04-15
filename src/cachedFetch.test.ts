import { cachedFetch, FetchFn } from './cachedFetch';
import * as cacheModule from './cache';

jest.mock('./cache');

const mockedReadCache = cacheModule.readCache as jest.MockedFunction<typeof cacheModule.readCache>;
const mockedWriteCache = cacheModule.writeCache as jest.MockedFunction<typeof cacheModule.writeCache>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cachedFetch', () => {
  const version = '2023-10-16';
  const mockData = { events: ['charge.created'] };

  it('returns cached data without calling fetchFn on cache hit', async () => {
    mockedReadCache.mockReturnValue(mockData);
    const fetchFn: FetchFn = jest.fn();

    const result = await cachedFetch(version, fetchFn);

    expect(result).toEqual(mockData);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(mockedWriteCache).not.toHaveBeenCalled();
  });

  it('calls fetchFn and writes cache on cache miss', async () => {
    mockedReadCache.mockReturnValue(null);
    const fetchFn: FetchFn = jest.fn().mockResolvedValue(mockData);

    const result = await cachedFetch(version, fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(version);
    expect(mockedWriteCache).toHaveBeenCalledWith(version, mockData);
    expect(result).toEqual(mockData);
  });

  it('skips cache read and write when noCache is true', async () => {
    const fetchFn: FetchFn = jest.fn().mockResolvedValue(mockData);

    const result = await cachedFetch(version, fetchFn, { noCache: true });

    expect(mockedReadCache).not.toHaveBeenCalled();
    expect(mockedWriteCache).not.toHaveBeenCalled();
    expect(fetchFn).toHaveBeenCalledWith(version);
    expect(result).toEqual(mockData);
  });

  it('propagates errors from fetchFn', async () => {
    mockedReadCache.mockReturnValue(null);
    const fetchFn: FetchFn = jest.fn().mockRejectedValue(new Error('network error'));

    await expect(cachedFetch(version, fetchFn)).rejects.toThrow('network error');
    expect(mockedWriteCache).not.toHaveBeenCalled();
  });
});
