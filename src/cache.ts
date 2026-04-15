import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CACHE_DIR = path.join(os.homedir(), '.stripe-diff', 'cache');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export function getCacheDir(): string {
  return CACHE_DIR;
}

export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function cacheKey(version: string): string {
  return path.join(CACHE_DIR, `schema-${version}.json`);
}

export function readCache<T>(version: string): T | null {
  const filePath = cacheKey(version);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(version: string, data: T): void {
  ensureCacheDir();
  const entry: CacheEntry<T> = { timestamp: Date.now(), data };
  fs.writeFileSync(cacheKey(version), JSON.stringify(entry, null, 2), 'utf-8');
}

export function clearCache(version?: string): void {
  if (version) {
    const filePath = cacheKey(version);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } else {
    if (fs.existsSync(CACHE_DIR)) {
      for (const file of fs.readdirSync(CACHE_DIR)) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    }
  }
}
