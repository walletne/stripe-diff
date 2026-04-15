import https from 'https';

const STRIPE_OPENAPI_BASE =
  'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.sdk.json';

/**
 * Fetches the Stripe OpenAPI spec for a given API version.
 * Stripe's public OpenAPI repo contains a single consolidated spec;
 * version-specific snapshots are fetched from the versioned path when available.
 */
export async function fetchSchema(apiVersion: string): Promise<Record<string, unknown>> {
  const url = `https://raw.githubusercontent.com/stripe/openapi/${apiVersion}/openapi/spec3.sdk.json`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 404) {
          // Fall back to master if version-specific tag not found
          https
            .get(STRIPE_OPENAPI_BASE, (fallbackRes) => {
              collectBody(fallbackRes, resolve, reject);
            })
            .on('error', reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch schema for version ${apiVersion}: HTTP ${res.statusCode}`));
          return;
        }
        collectBody(res, resolve, reject);
      })
      .on('error', reject);
  });
}

function collectBody(
  res: import('http').IncomingMessage,
  resolve: (value: Record<string, unknown>) => void,
  reject: (reason: Error) => void
): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => {
    try {
      const raw = Buffer.concat(chunks).toString('utf-8');
      resolve(JSON.parse(raw) as Record<string, unknown>);
    } catch (err) {
      reject(new Error(`Failed to parse schema JSON: ${(err as Error).message}`));
    }
  });
  res.on('error', reject);
}
