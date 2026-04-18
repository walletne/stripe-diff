import { DiffAnnotation, AnnotationSeverity } from './diffAnnotations';

const ICONS: Record<AnnotationSeverity, string> = {
  info: 'ℹ',
  warning: '⚠',
  error: '✖',
};

export function formatAnnotation(a: DiffAnnotation): string {
  return `${ICONS[a.severity]} [${a.severity.toUpperCase()}] ${a.event} — ${a.message}`;
}

export function formatAnnotations(annotations: DiffAnnotation[]): string {
  if (annotations.length === 0) return 'No annotations.';
  return annotations.map(formatAnnotation).join('\n');
}

export function formatAnnotationsJson(annotations: DiffAnnotation[]): string {
  return JSON.stringify(annotations, null, 2);
}

export function formatAnnotationsSummary(annotations: DiffAnnotation[]): string {
  const counts: Record<AnnotationSeverity, number> = { info: 0, warning: 0, error: 0 };
  for (const a of annotations) counts[a.severity]++;
  const parts = (Object.keys(counts) as AnnotationSeverity[])
    .filter(k => counts[k] > 0)
    .map(k => `${counts[k]} ${k}(s)`);
  return parts.length > 0 ? `Annotations: ${parts.join(', ')}` : 'No annotations.';
}
