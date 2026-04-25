import { DiffEntry } from './diffSchema';

export type ChangeCategory =
  | 'structural'
  | 'type-change'
  | 'field-addition'
  | 'field-removal'
  | 'constraint'
  | 'unknown';

export interface ClassifiedEntry {
  entry: DiffEntry;
  category: ChangeCategory;
  label: string;
}

export function classifyChange(entry: DiffEntry): ChangeCategory {
  const { type, path } = entry;
  if (type === 'added') return 'field-addition';
  if (type === 'removed') return 'field-removal';
  if (type === 'changed') {
    const { oldValue, newValue } = entry as any;
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      const typeKeywords = ['string', 'integer', 'boolean', 'object', 'array', 'number', 'null'];
      if (typeKeywords.includes(oldValue) || typeKeywords.includes(newValue)) {
        return 'type-change';
      }
      if (path.endsWith('.required') || path.endsWith('.nullable') || path.endsWith('.enum')) {
        return 'constraint';
      }
    }
    if (path.split('.').length <= 2) return 'structural';
  }
  return 'unknown';
}

export function labelChange(category: ChangeCategory): string {
  const labels: Record<ChangeCategory, string> = {
    structural: 'Structural change',
    'type-change': 'Type change',
    'field-addition': 'Field added',
    'field-removal': 'Field removed',
    constraint: 'Constraint change',
    unknown: 'Unknown change',
  };
  return labels[category];
}

export function classifyAll(entries: DiffEntry[]): ClassifiedEntry[] {
  return entries.map((entry) => {
    const category = classifyChange(entry);
    return { entry, category, label: labelChange(category) };
  });
}

export function groupByCategory(
  classified: ClassifiedEntry[]
): Record<ChangeCategory, ClassifiedEntry[]> {
  const result = {} as Record<ChangeCategory, ClassifiedEntry[]>;
  for (const item of classified) {
    if (!result[item.category]) result[item.category] = [];
    result[item.category].push(item);
  }
  return result;
}

export function formatClassifyReport(classified: ClassifiedEntry[]): string {
  const grouped = groupByCategory(classified);
  const lines: string[] = ['Classification Report', '='.repeat(40)];
  for (const [cat, items] of Object.entries(grouped)) {
    lines.push(`\n${labelChange(cat as ChangeCategory)} (${items.length})`);
    for (const { entry } of items) {
      lines.push(`  ${entry.path}`);
    }
  }
  return lines.join('\n');
}

export function formatClassifyJson(classified: ClassifiedEntry[]): string {
  return JSON.stringify(
    classified.map(({ entry, category, label }) => ({ ...entry, category, label })),
    null,
    2
  );
}
