import { readCache, writeCache } from './cache';

export type FetchFn = (version: string) => Promise<unknown>;

/**
 * Wraps a fetch function with a local disk cache.
 * On cache hit (within TTL), returns cached data without making a network call.
 * On cache miss, calls fetchFn, stores the result, and returns it.
 */
export async function cachedFetch<T>(
  version: string,
  fetchFn: FetchFn,
  options: { noCache?: boolean } = {}
): Promise<T> {
  if (!options.noCache) {
    const cached = readCache<T>(version);
    if (cached !== null) {
      return cached;
    }
  }

  const data = (await fetchFn(version)) as T;
  if (!options.noCache) {
    writeCache<T>(version, data);
  }
  return data;
}
