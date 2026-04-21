import { EventDiff } from './diffSchema';

export interface ReplayStep {
  version: string;
  timestamp: string;
  diffs: Record<string, EventDiff>;
}

export interface ReplayReport {
  steps: ReplayStep[];
  totalChanges: number;
  eventsCovered: string[];
}

export function buildReplayReport(steps: ReplayStep[]): ReplayReport {
  const eventSet = new Set<string>();
  let totalChanges = 0;

  for (const step of steps) {
    for (const [event, diff] of Object.entries(step.diffs)) {
      eventSet.add(event);
      totalChanges +=
        diff.added.length + diff.removed.length + diff.changed.length;
    }
  }

  return {
    steps,
    totalChanges,
    eventsCovered: Array.from(eventSet).sort(),
  };
}

export function formatReplayReport(report: ReplayReport): string {
  const lines: string[] = [];
  lines.push(`Replay Report — ${report.steps.length} step(s), ${report.totalChanges} total change(s)`);
  lines.push(`Events covered: ${report.eventsCovered.join(', ') || 'none'}`);
  lines.push('');

  for (const step of report.steps) {
    lines.push(`## Version ${step.version}  [${step.timestamp}]`);
    const events = Object.keys(step.diffs);
    if (events.length === 0) {
      lines.push('  (no changes)');
    } else {
      for (const event of events) {
        const diff = step.diffs[event];
        const counts = [
          diff.added.length > 0 ? `+${diff.added.length} added` : '',
          diff.removed.length > 0 ? `-${diff.removed.length} removed` : '',
          diff.changed.length > 0 ? `~${diff.changed.length} changed` : '',
        ]
          .filter(Boolean)
          .join(', ');
        lines.push(`  ${event}: ${counts || 'no changes'}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function formatReplayJson(report: ReplayReport): string {
  return JSON.stringify(report, null, 2);
}
