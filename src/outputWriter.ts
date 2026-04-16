import * as fs from 'fs';
import * as path from 'path';

export interface WriteOptions {
  outputPath?: string;
  silent?: boolean;
}

export function writeOutput(content: string, options: WriteOptions = {}): void {
  const { outputPath, silent = false } = options;

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (dir && dir !== '.') {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, content, 'utf8');
    if (!silent) {
      process.stderr.write(`Output written to ${outputPath}\n`);
    }
  } else {
    if (!silent) {
      process.stdout.write(content);
    }
  }
}

export function resolveOutputPath(
  outputPath: string | undefined,
  format: string,
  versionA: string,
  versionB: string
): string | undefined {
  if (!outputPath) return undefined;

  // If path has no extension, append format-based extension
  if (!path.extname(outputPath)) {
    const ext = format === 'json' ? '.json' : format === 'markdown' ? '.md' : '.txt';
    return `${outputPath}_${versionA}_${versionB}${ext}`;
  }
  return outputPath;
}
