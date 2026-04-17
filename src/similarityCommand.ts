import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { computeSimilarity, formatSimilarity } from './similarityScore';
import { validateVersions } from './versionList';

export interface SimilarityCommandOptions {
  versionA: string;
  versionB: string;
  json?: boolean;
}

export async function runSimilarityCommand(opts: SimilarityCommandOptions): Promise<void> {
  const { versionA, versionB, json } = opts;

  await validateVersions([versionA, versionB]);

  const [schemaA, schemaB] = await Promise.all([
    cachedFetch(versionA),
    cachedFetch(versionB),
  ]);

  const eventsA = extractEventSchemas(schemaA);
  const eventsB = extractEventSchemas(schemaB);

  const diffs = diffEventSchemas(eventsA, eventsB);
  const result = computeSimilarity(diffs);

  if (json) {
    console.log(JSON.stringify({
      versionA,
      versionB,
      ...result,
    }, null, 2));
  } else {
    console.log(`\nComparing ${versionA} → ${versionB}\n`);
    console.log(formatSimilarity(result));
  }
}
