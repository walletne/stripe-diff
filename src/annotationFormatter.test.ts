import {
  formatAnnotation,
  formatAnnotations,
  formatAnnotationsJson,
  formatAnnotationsSummary,
} from './annotationFormatter';
import { DiffAnnotation } from './diffAnnotations';

function makeAnnotation(overrides: Partial<DiffAnnotation> = {}): DiffAnnotation {
  return { event: 'charge.updated', field: 'amount', severity: 'warning', message: 'Field changed', ...overrides };
}

describe('formatAnnotation', () => {
  it('includes severity icon and event', () => {
    const result = formatAnnotation(makeAnnotation());
    expect(result).toContain('WARNING');
    expect(result).toContain('charge.updated');
    expect(result).toContain('Field changed');
  });

  it('uses correct icon for error', () => {
    const result = formatAnnotation(makeAnnotation({ severity: 'error' }));
    expect(result).toContain('✖');
  });
});

describe('formatAnnotations', () => {
  it('returns placeholder for empty list', () => {
    expect(formatAnnotations([])).toBe('No annotations.');
  });

  it('joins multiple annotations with newlines', () => {
    const result = formatAnnotations([makeAnnotation(), makeAnnotation({ severity: 'error' })]);
    expect(result.split('\n')).toHaveLength(2);
  });
});

describe('formatAnnotationsJson', () => {
  it('returns valid JSON array', () => {
    const result = formatAnnotationsJson([makeAnnotation()]);
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].severity).toBe('warning');
  });
});

describe('formatAnnotationsSummary', () => {
  it('summarises counts by severity', () => {
    const annotations = [
      makeAnnotation({ severity: 'error' }),
      makeAnnotation({ severity: 'warning' }),
      makeAnnotation({ severity: 'warning' }),
    ];
    const result = formatAnnotationsSummary(annotations);
    expect(result).toContain('1 error(s)');
    expect(result).toContain('2 warning(s)');
  });

  it('returns placeholder when empty', () => {
    expect(formatAnnotationsSummary([])).toBe('No annotations.');
  });
});
