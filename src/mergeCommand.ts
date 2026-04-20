import { Command } from "commander";
import { cachedFetch } from "./cachedFetch";
import { extractEventSchemas } from "./parseSchema";
import { diffEventSchemas } from "./diffSchema";
import { mergeDiffs, formatMergeConflicts } from "./diffMerge";
import { formatDiff } from "./formatDiff";

export function registerMergeCommand(program: Command): void {
  program
    .command("merge <versionA> <versionB> <versionC>")
    .description(
      "Merge diffs from A→B and A→C into a combined diff, reporting conflicts"
    )
    .option("--json", "Output as JSON")
    .option("--no-color", "Disable color output")
    .action(async (versionA: string, versionB: string, versionC: string, opts) => {
      try {
        const [rawA, rawB, rawC] = await Promise.all([
          cachedFetch(versionA),
          cachedFetch(versionB),
          cachedFetch(versionC),
        ]);

        const schemasA = extractEventSchemas(rawA);
        const schemasB = extractEventSchemas(rawB);
        const schemasC = extractEventSchemas(rawC);

        const diffAB = diffEventSchemas(schemasA, schemasB);
        const diffAC = diffEventSchemas(schemasA, schemasC);

        const { merged, conflicts } = mergeDiffs(diffAB, diffAC);

        if (opts.json) {
          console.log(JSON.stringify({ merged, conflicts }, null, 2));
          return;
        }

        if (conflicts.length > 0) {
          console.warn(formatMergeConflicts(conflicts));
          console.warn("");
        }

        const formatted = formatDiff(merged);
        if (!formatted.trim()) {
          console.log("No differences found in merged diff.");
        } else {
          console.log(formatted);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
