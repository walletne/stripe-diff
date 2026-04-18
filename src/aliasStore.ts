import * as fs from 'fs';
import * as path from 'path';
import { AliasMap } from './diffAlias';
import { getCacheDir } from './cache';

const ALIAS_FILE = 'aliases.json';

export function getAliasPath(): string {
  return path.join(getCacheDir(), ALIAS_FILE);
}

export function loadAliases(): AliasMap {
  const p = getAliasPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as AliasMap;
  } catch {
    return {};
  }
}

export function saveAliases(map: AliasMap): void {
  const p = getAliasPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(map, null, 2), 'utf8');
}
