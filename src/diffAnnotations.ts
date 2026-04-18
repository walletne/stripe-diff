import { DiffResult, FieldChange } from './diffSchema';

export type AnnotationSeverity = 'info' | 'warning' | 'error';

export interface DiffAnnotation {
  event: string;
  field: string;
  severity: AnnotationSeverity;
  message: string;
}

export function annotateChange(event: string, change: FieldChange): DiffAnnotation {
  const { field, type } = change;

  if (type === 'removed') {
    return { event, field, severity: 'error', message: `Field '${field}' was removed` };
  }
  if (type === 'added') {
    return { event, field, severity: 'info', message: `Field '${field}' was added` };
  }
  if (type === 'changed') {
    const from = change.from ?? 'unknown';
    const to = change.to ?? 'unknown';
    const severity: AnnotationSeverity = from !== to ? 'warning' : 'info';
    return { event, field, severity, message: `Field '${field}' type changed from '${from}' to '${to}'` };
  }
  return { event, field, severity: 'info', message: `Field '${field}' modified` };
}

export function annotateAll(diff: DiffResult): DiffAnnotation[] {
  const annotations: DiffAnnotation[] = [];
  for (const [event, changes] of Object.entries(diff)) {
    for (const change of changes) {
      annotations.push(annotateChange(event, change));
    }
  }
  return annotations;
}

export function filterBySeverity(
  annotations: DiffAnnotation[],
  severity: AnnotationSeverity
): DiffAnnotation[] {
  const order: AnnotationSeverity[] = ['info', 'warning', 'error'];
  const minIndex = order.indexOf(severity);
  return annotations.filter(a => order.indexOf(a.severity) >= minIndex);
}
