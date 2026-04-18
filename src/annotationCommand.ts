import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { annotateAll, filterBySeverity, AnnotationSeverity } from './diffAnnotations';
import { formatAnnotations, formatAnnotationsJson, formatAnnotationsSummary } from './annotationFormatter';

export function registerAnnotationCommand(program: Command): void {
  program
    .command('annotate <version1> <version2>')
    .description('Show annotated diff between two Stripe API versions')
    .option('--severity <level>', 'Minimum severity to show: info | warning | error', 'info')
    .option('--format <fmt>', 'Output format: text | json | summary', 'text')
    .action(async (version1: string, version2: string, opts) => {
      const [schema1, schema2] = await Promise.all([
        cachedFetch(version1),
        cachedFetch(version2),
      ]);

      const events1 = extractEventSchemas(schema1);
      const events2 = extractEventSchemas(schema2);
      const diff = diffEventSchemas(events1, events2);

      let annotations = annotateAll(diff);
      const severity = opts.severity as AnnotationSeverity;
      annotations = filterBySeverity(annotations, severity);

      if (opts.format === 'json') {
        console.log(formatAnnotationsJson(annotations));
      } else if (opts.format === 'summary') {
        console.log(formatAnnotationsSummary(annotations));
      } else {
        console.log(formatAnnotations(annotations));
      }
    });
}
