import * as https from "https";
import { collectBody } from "./fetchSchema";

const STRIPE_OPENAPI_INDEX_URL =
  "https://raw.githubusercontent.com/stripe/openapi/master/openapi/index.json";

export interface VersionIndex {
  versions: string[];
  latest: string;
}

/**
 * Fetches the list of available Stripe API versions from the openapi index.
 */
export async function fetchAvailableVersions(): Promise<VersionIndex> {
  return new Promise((resolve, reject) => {
    const req = https.get(STRIPE_OPENAPI_INDEX_URL, async (res) => {
      if (res.statusCode !== 200) {
        reject(
          new Error(
            `Failed to fetch version index: HTTP ${res.statusCode}`
          )
        );
        return;
      }
      try {
        const body = await collectBody(res);
        const data = JSON.parse(body) as { versions: string[] };
        if (!Array.isArray(data.versions) || data.versions.length === 0) {
          reject(new Error("Version index is empty or malformed"));
          return;
        }
        const sorted = [...data.versions].sort();
        resolve({ versions: sorted, latest: sorted[sorted.length - 1] });
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Validates that both requested versions exist in the available list.
 */
export function validateVersions(
  from: string,
  to: string,
  available: string[]
): void {
  if (!available.includes(from)) {
    throw new Error(
      `Version "${from}" is not available. Run with --list-versions to see options.`
    );
  }
  if (!available.includes(to)) {
    throw new Error(
      `Version "${to}" is not available. Run with --list-versions to see options.`
    );
  }
  if (from === to) {
    throw new Error(`"from" and "to" versions must be different (got "${from}").`);
  }
}
