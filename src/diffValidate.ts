import { EventDiff } from "./diffSchema";

export interface ValidationRule {
  name: string;
  description: string;
  check: (diff: EventDiff) => string[];
}

export interface ValidationResult {
  event: string;
  rule: string;
  messages: string[];
}

export interface ValidationReport {
  results: ValidationResult[];
  passed: number;
  failed: number;
}

const rules: ValidationRule[] = [
  {
    name: "no-type-widening",
    description: "Detect when a field type changes to a broader type",
    check: (diff) => {
      const msgs: string[] = [];
      for (const [field, change] of Object.entries(diff.changes)) {
        if (
          change.before?.type === "string" &&
          change.after?.type === "object"
        ) {
          msgs.push(
            `Field "${field}" widened from string to object`
          );
        }
      }
      return msgs;
    },
  },
  {
    name: "no-required-added",
    description: "Detect when a new required field is added",
    check: (diff) => {
      const msgs: string[] = [];
      for (const [field, change] of Object.entries(diff.changes)) {
        if (
          !change.before &&
          change.after?.required === true
        ) {
          msgs.push(
            `Required field "${field}" was added — may break existing consumers`
          );
        }
      }
      return msgs;
    },
  },
  {
    name: "no-field-removal",
    description: "Detect when an existing field is removed",
    check: (diff) => {
      const msgs: string[] = [];
      for (const [field, change] of Object.entries(diff.changes)) {
        if (change.before && !change.after) {
          msgs.push(`Field "${field}" was removed`);
        }
      }
      return msgs;
    },
  },
];

export function validateDiff(
  diffs: Record<string, EventDiff>,
  ruleNames?: string[]
): ValidationReport {
  const active = ruleNames
    ? rules.filter((r) => ruleNames.includes(r.name))
    : rules;

  const results: ValidationResult[] = [];

  for (const [event, diff] of Object.entries(diffs)) {
    for (const rule of active) {
      const messages = rule.check(diff);
      if (messages.length > 0) {
        results.push({ event, rule: rule.name, messages });
      }
    }
  }

  const failed = results.length;
  const passed = Object.keys(diffs).length * active.length - failed;

  return { results, passed, failed };
}

export function formatValidationReport(report: ValidationReport): string {
  if (report.failed === 0) {
    return `✅ All validations passed (${report.passed} checks).`;
  }
  const lines: string[] = [
    `❌ ${report.failed} validation issue(s) found:\n`,
  ];
  for (const r of report.results) {
    lines.push(`  [${r.rule}] ${r.event}`);
    for (const msg of r.messages) {
      lines.push(`    • ${msg}`);
    }
  }
  lines.push(`\n${report.passed} passed, ${report.failed} failed.`);
  return lines.join("\n");
}
