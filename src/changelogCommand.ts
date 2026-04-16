import { filteredDiff } from './filteredDiff';
import { buildChangelogEntry, formatChangelogMarkdown, formatChangelogJson } from './changelogExport';
import { writeOutput } from './outputWriter';
import { parseEventPatterns } from './eventFilter';

export interface ChangelogCommandOptions {
  fromVersion: string;
  toVersion: string;
  format: 'markdown' | 'json';
  output?: string;
  events?: string[];
}

export async function runChangelogCommand(options: ChangelogCommandOptions): Promise<void> {
  const { fromVersion, toVersion, format, output, events } = options;

  const patterns = events && events.length > 0 ? parseEventPatterns(events) : [];

  const diffs = await filteredDiff(fromVersion, toVersion, patterns);

  const entry = buildChangelogEntry(fromVersion, toVersion, diffs);

  const formatted =
    format === 'json'
      ? formatChangelogJson(entry)
      : formatChangelogMarkdown(entry);

  await writeOutput(formatted, output);
}
