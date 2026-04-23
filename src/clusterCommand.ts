import { Command } from 'commander';
import { clusterDiff, formatClusterReport, formatClusterJson, ClusterStrategy } from './diffCluster';
import { annotateAll } from './diffAnnotations';
import { filteredDiff } from './filteredDiff';
import { cachedFetch } from './cachedFetch';
import { parseSchema } from './parseSchema';

export function registerClusterCommand(program: Command): void {
  program
    .command('cluster <v1> <v2>')
    .description('Cluster diff changes between two Stripe API versions')
    .option('-s, --strategy <strategy>', 'Clustering strategy: type | depth | object', 'type')
    .option('-e, --event <pattern>', 'Filter by event pattern', '*')
    .option('--json', 'Output as JSON')
    .action(async (v1: string, v2: string, opts) => {
      const strategy = (opts.strategy as ClusterStrategy) ?? 'type';

      const [schema1, schema2] = await Promise.all([
        cachedFetch(v1).then(parseSchema),
        cachedFetch(v2).then(parseSchema),
      ]);

      const diff = filteredDiff(schema1, schema2, {
        patterns: [opts.event],
      });

      const allEntries = Object.values(diff).flat();
      const annotated = annotateAll(allEntries.map((c) => ({ change: c, severity: 'info' as const, tags: [] })));

      const report = clusterDiff(annotated, strategy);

      if (opts.json) {
        console.log(formatClusterJson(report));
      } else {
        console.log(formatClusterReport(report));
      }
    });
}
