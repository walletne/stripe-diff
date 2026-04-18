import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadAliases, saveAliases, getAliasPath } from './aliasStore';
import * as cache from './cache';

describe('aliasStore', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripe-diff-alias-'));
    jest.spyOn(cache, 'getCacheDir').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('returns empty map when file missing', () => {
    expect(loadAliases()).toEqual({});
  });

  it('saves and loads aliases', () => {
    const map = { latest: '2024-06-01', prev: '2023-10-16' };
    saveAliases(map);
    expect(loadAliases()).toEqual(map);
  });

  it('returns empty map on corrupt file', () => {
    const p = getAliasPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, 'NOT JSON', 'utf8');
    expect(loadAliases()).toEqual({});
  });
});
