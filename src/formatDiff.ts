import { DiffResult, SchemaDiff } from "./diffSchema";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function green(s: string) { return `${GREEN}${s}${RESET}`; }
function red(s: string) { return `${RED}${s}${RESET}`; }
function yellow(s: string) { return `${YELLOW}${s}${RESET}`; }
function bold(s: string) { return `${BOLD}${s}${RESET}`; }
function dim(s: string) { return `${DIM}${s}${RESET}`; }

function formatSchemaDiff(diff: SchemaDiff): string {
  const lines: string[] = [];
  lines.push(bold(`\n● ${diff.eventType}`));

  for (const field of diff.added) {
    lines.push(green(`  + ${field}`));
  }
  for (const field of diff.removed) {
    lines.push(red(`  - ${field}`));
  }
  for (const change of diff.changed) {
    lines.push(yellow(`  ~ ${change.path}`));
    lines.push(dim(`      from: ${JSON.stringify(change.from)}`));
    lines.push(dim(`      to:   ${JSON.stringify(change.to)}`));
  }

  return lines.join("\n");
}

export function formatDiffResult(result: DiffResult, showUnchanged = false): string {
  const lines: string[] = [];

  lines.push(
    bold(`\nStripe Schema Diff: ${result.fromVersion} → ${result.toVersion}`)
  );
  lines.push(`${"-".repeat(50)}`);

  if (result.diffs.length === 0) {
    lines.push(dim("No differences found."));
  } else {
    lines.push(`${bold(String(result.diffs.length))} event type(s) changed:\n`);
    for (const diff of result.diffs) {
      lines.push(formatSchemaDiff(diff));
    }
  }

  if (showUnchanged && result.unchanged.length > 0) {
    lines.push(dim(`\n${result.unchanged.length} event type(s) unchanged.`));
  }

  lines.push("");
  return lines.join("\n");
}
