import { validateVersions } from './versionList';

export interface VersionRange {
  from: string;
  to: string;
}

/**
 * Parse a version range string like "2020-08-27..2022-11-15"
 * or return a simple {from, to} pair.
 */
export function parseVersionRange(input: string): VersionRange {
  const parts = input.split('..');
  if (parts.length === 2) {
    const [from, to] = parts;
    if (!from || !to) {
      throw new Error(`Invalid version range: "${input}". Expected format: FROM..TO`);
    }
    return { from: from.trim(), to: to.trim() };
  }
  throw new Error(
    `Invalid version range: "${input}". Expected format: FROM..TO (e.g. 2020-08-27..2022-11-15)`
  );
}

/**
 * Validate that both versions in the range exist in the known version list
 * and that `from` comes before `to`.
 */
export async function validateVersionRange(range: VersionRange): Promise<void> {
  const versions = await validateVersions([range.from, range.to]);

  const fromIndex = versions.indexOf(range.from);
  const toIndex = versions.indexOf(range.to);

  if (fromIndex === -1) {
    throw new Error(`Unknown Stripe API version: "${range.from}"`);
  }
  if (toIndex === -1) {
    throw new Error(`Unknown Stripe API version: "${range.to}"`);
  }
  if (fromIndex >= toIndex) {
    throw new Error(
      `Version "${range.from}" must be older than "${range.to}". Check the order of your range.`
    );
  }
}
