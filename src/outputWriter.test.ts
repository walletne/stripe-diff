import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { writeOutput, resolveOutputPath } from './outputWriter';

describe('writeOutput', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripe-diff-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes content to file when outputPath is provided', () => {
    const filePath = path.join(tmpDir, 'output.txt');
    writeOutput('hello world', { outputPath: filePath, silent: true });
    expect(fs.readFileSync(filePath, 'utf8')).toBe('hello world');
  });

  it('creates nested directories as needed', () => {
    const filePath = path.join(tmpDir, 'nested', 'dir', 'output.txt');
    writeOutput('content', { outputPath: filePath, silent: true });
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('writes to stdout when no outputPath', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    writeOutput('stdout content');
    expect(spy).toHaveBeenCalledWith('stdout content');
    spy.mockRestore();
  });

  it('does not write to stdout when silent and no outputPath', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    writeOutput('silent content', { silent: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('resolveOutputPath', () => {
  it('returns undefined when no outputPath', () => {
    expect(resolveOutputPath(undefined, 'text', '2023-01-01', '2024-01-01')).toBeUndefined();
  });

  it('appends .json extension for json format', () => {
    const result = resolveOutputPath('output', 'json', '2023-01-01', '2024-01-01');
    expect(result).toBe('output_2023-01-01_2024-01-01.json');
  });

  it('appends .md extension for markdown format', () => {
    const result = resolveOutputPath('report', 'markdown', 'v1', 'v2');
    expect(result).toBe('report_v1_v2.md');
  });

  it('preserves existing extension', () => {
    const result = resolveOutputPath('output.txt', 'json', 'v1', 'v2');
    expect(result).toBe('output.txt');
  });
});
