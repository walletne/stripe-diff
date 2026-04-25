import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { parseVersionRange } from './versionRange';
import { filteredDiff } from './filteredDiff';
import { buildAuditReport, formatAuditReport, formatAuditJson } from './diffAudit';
import { writeOutput } from './outputWriter';

export function registerAuditCommand(program: Command): void {
  program
    .command('audit <range>')
    .description('Generate an audit log of field changes between versions')
    .option('-e, --event <pattern>', 'Filter by event name pattern')
    .option('-f, --format <fmt>', 'Output format: text or json', 'text')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (range: string, opts) => {
      const [fromVersion, toVersion] = parseVersionRange(range);

      const [schemaA, schemaB] = await Promise.all([
        cachedFetch(fromVersion),
        cachedFetch(toVersion),
      ]);

      const patterns = opts.event ? [opts.event] : [];
      const entries = filteredDiff(schemaA, schemaB, patterns);

      const report = buildAuditReport(entries, fromVersion, toVersion);

      const output =
        opts.format === 'json'
          ? formatAuditJson(report)
          : formatAuditReport(report);

      await writeOutput(output, opts.output);
    });
}
