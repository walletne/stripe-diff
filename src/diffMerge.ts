import { EventDiff, FieldChange } from "./diffSchema";

export interface MergeConflict {
  event: string;
  field: string;
  changes: FieldChange[];
}

export interface MergeResult {
  merged: EventDiff;
  conflicts: MergeConflict[];
}

/**
 * Merges two EventDiff objects together.
 * If both diffs modify the same field in the same event with different values,
 * a conflict is recorded and the change from `base` is kept.
 */
export function mergeDiffs(base: EventDiff, other: EventDiff): MergeResult {
  const merged: EventDiff = {};
  const conflicts: MergeConflict[] = [];

  const allEvents = new Set([...Object.keys(base), ...Object.keys(other)]);

  for (const event of allEvents) {
    const baseChanges = base[event] ?? [];
    const otherChanges = other[event] ?? [];

    if (baseChanges.length === 0) {
      merged[event] = otherChanges;
      continue;
    }

    if (otherChanges.length === 0) {
      merged[event] = baseChanges;
      continue;
    }

    const baseByField = new Map(baseChanges.map((c) => [c.field, c]));
    const otherByField = new Map(otherChanges.map((c) => [c.field, c]));
    const allFields = new Set([...baseByField.keys(), ...otherByField.keys()]);

    const eventChanges: FieldChange[] = [];

    for (const field of allFields) {
      const bc = baseByField.get(field);
      const oc = otherByField.get(field);

      if (bc && oc) {
        if (bc.type !== oc.type || bc.before !== oc.before || bc.after !== oc.after) {
          conflicts.push({ event, field, changes: [bc, oc] });
        }
        eventChanges.push(bc);
      } else {
        eventChanges.push((bc ?? oc)!);
      }
    }

    merged[event] = eventChanges;
  }

  return { merged, conflicts };
}

/**
 * Formats merge conflicts as a human-readable string.
 */
export function formatMergeConflicts(conflicts: MergeConflict[]): string {
  if (conflicts.length === 0) return "No conflicts.";

  const lines: string[] = [`Merge conflicts (${conflicts.length}):`];
  for (const c of conflicts) {
    lines.push(`  [${c.event}] field "${c.field}"`);
    for (const ch of c.changes) {
      lines.push(`    ${ch.type}: ${ch.before ?? "(none)"} -> ${ch.after ?? "(none)"}`);
    }
  }
  return lines.join("\n");
}
