export interface AliasMap { [alias: string]: string; }

const DEFAULT_ALIASES: AliasMap = {};

export function resolveAlias(alias: string, map: AliasMap): string | undefined {
  return map[alias];
}

export function addAlias(alias: string, version: string, map: AliasMap): AliasMap {
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    throw new Error(`Invalid alias "${alias}": only alphanumeric, dash, and underscore allowed`);
  }
  return { ...map, [alias]: version };
}

export function removeAlias(alias: string, map: AliasMap): AliasMap {
  const next = { ...map };
  delete next[alias];
  return next;
}

export function listAliases(map: AliasMap): string {
  const entries = Object.entries(map);
  if (entries.length === 0) return 'No aliases defined.';
  const rows = entries.map(([a, v]) => `  ${a.padEnd(20)} ${v}`);
  return ['Alias               Version', ...rows].join('\n');
}

export function mergeAliases(base: AliasMap, overrides: AliasMap): AliasMap {
  return { ...base, ...overrides };
}

export function resolveVersionArg(arg: string, map: AliasMap): string {
  return map[arg] ?? arg;
}
