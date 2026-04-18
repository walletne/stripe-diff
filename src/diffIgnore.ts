import * as fs from 'fs';
import * as path from 'path';

export interface IgnoreRule {
  pattern: string;
  type: 'field' | 'event' | 'glob';
}

export function parseIgnoreFile(content: string): IgnoreRule[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      if (line.startsWith('event:')) {
        return { pattern: line.slice(6).trim(), type: 'event' };
      }
      if (line.startsWith('field:')) {
        return { pattern: line.slice(6).trim(), type: 'field' };
      }
      return { pattern: line, type: 'glob' };
    });
}

export function matchesIgnoreRule(rule: IgnoreRule, eventName: string, fieldPath: string): boolean {
  if (rule.type === 'event') {
    return eventName === rule.pattern || eventName.startsWith(rule.pattern.replace('*', ''));
  }
  if (rule.type === 'field') {
    return fieldPath === rule.pattern || fieldPath.endsWith(rule.pattern);
  }
  // glob: match event:field pattern
  const [evPart, fieldPart] = rule.pattern.split(':');
  const evMatch = !evPart || evPart === '*' || eventName === evPart;
  const fMatch = !fieldPart || fieldPart === '*' || fieldPath === fieldPart || fieldPath.endsWith(fieldPart);
  return evMatch && fMatch;
}

export function loadIgnoreFile(filePath: string): IgnoreRule[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseIgnoreFile(content);
}

export function applyIgnoreRules(
  rules: IgnoreRule[],
  entries: Array<{ event: string; field: string }>
): Array<{ event: string; field: string }> {
  return entries.filter(
    e => !rules.some(r => matchesIgnoreRule(r, e.event, e.field))
  );
}

export function defaultIgnorePath(): string {
  return path.join(process.cwd(), '.stripediffignore');
}
