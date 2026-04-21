import { Command } from "commander";
import { filteredDiff } from "./filteredDiff";
import { compareDiffs, formatCompareReport, formatCompareJson } from "./diffCompare";
import { writeOutput } from "./outputWriter";

export function registerCompareCommand(program: Command): void {
  program
    .command("compare")
    .description(
      "Compare diff results between two version pairs to highlight divergence"
    )
    .requiredOption("--from-a <version>", "Older version of pair A")
    .requiredOption("--to-a <version>", "Newer version of pair A")
    .requiredOption("--from-b <version>", "Older version of pair B")
    .requiredOption("--to-b <version>", "Newer version of pair B")
    .option("--event <pattern>", "Filter by event name pattern")
    .option("--format <fmt>", "Output format: text | json", "text")
    .option("--output <file>", "Write output to file")
    .action(async (opts) => {
      try {
        const patterns = opts.event ? [opts.event] : [];

        const [diffA, diffB] = await Promise.all([
          filteredDiff(opts.fromA, opts.toA, patterns),
          filteredDiff(opts.fromB, opts.toB, patterns),
        ]);

        const result = compareDiffs(diffA, diffB);

        const output =
          opts.format === "json"
            ? formatCompareJson(result)
            : formatCompareReport(result);

        await writeOutput(output, opts.output);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
