import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  readCache,
  writeCache,
  clearCache,
  cacheKey,
  getCacheDir,
  CacheEntry,
} from './cache';

const TEST_CACHE_DIR = path.join(os.tmpdir(), 'stripe-diff-test-cache');

// Redirect cache dir for tests
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => path.join(require('os').tmpdir(), 'stripe-diff-test'),
}));

afterEach(() => {
  clearCache();
});

describe('cache', () => {
  it('returns null for a missing cache entry', () => {
    const result = readCache('2023-01-01');
    expect(result).toBeNull();
  });

  it('writes and reads back data correctly', () => {
    const data = { foo: 'bar', count: 42 };
    writeCache('2023-01-01', data);
    const result = readCache<typeof data>('2023-01-01');
    expect(result).toEqual(data);
  });

  it('returns null for an expired cache entry', () => {
    const data = { foo: 'bar' };
    writeCache('2023-06-01', data);
    const filePath = cacheKey('2023-06-01');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const entry: CacheEntry<typeof data> = JSON.parse(raw);
    // Backdate timestamp by 25 hours
    entry.timestamp = Date.now() - 25 * 60 * 60 * 1000;
    fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    const result = readCache('2023-06-01');
    expect(result).toBeNull();
  });

  it('clears a specific version from cache', () => {
    writeCache('2022-01-01', { x: 1 });
    writeCache('2022-06-01', { x: 2 });
    clearCache('2022-01-01');
    expect(readCache('2022-01-01')).toBeNull();
    expect(readCache<{ x: number }>('2022-06-01')).toEqual({ x: 2 });
  });

  it('clears all versions from cache', () => {
    writeCache('2021-01-01', { a: 1 });
    writeCache('2021-06-01', { b: 2 });
    clearCache();
    expect(readCache('2021-01-01')).toBeNull();
    expect(readCache('2021-06-01')).toBeNull();
  });

  it('returns null when cache file contains invalid JSON', () => {
    const filePath = cacheKey('2020-01-01');
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, 'not-json', 'utf-8');
    const result = readCache('2020-01-01');
    expect(result).toBeNull();
  });
});
