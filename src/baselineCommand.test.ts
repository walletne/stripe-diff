import { Command } from 'commander';
import { registerBaselineCommand } from './baselineCommand';
import * as cachedFetchMod from './cachedFetch';
import * as parseSchema from './parseSchema';
import * as diffSchema from './diffSchema';
import * as diffBaseline from './diffBaseline';

jest.mock('./cachedFetch');
jest.mock('./parseSchema');
jest.mock('./diffSchema');
jest.mock('./diffBaseline');

const mockFetch = cachedFetchMod.cachedFetch as jest.Mock;
const mockExtract = parseSchema.extractEventSchemas as jest.Mock;
const mockDiff = diffSchema.diffEventSchemas as jest.Mock;
const mockSave = diffBaseline.saveBaseline as jest.Mock;
const mockLoad = diffBaseline.loadBaseline as jest.Mock;
const mockCompare = diffBaseline.compareToBaseline as jest.Mock;
const mockFormat = diffBaseline.formatBaselineComparison as jest.Mock;

function makeProgram() {
  const p = new Command();
  p.exitOverride();
  registerBaselineCommand(p);
  return p;
}

beforeEach(() => jest.clearAllMocks());

describe('baseline save', () => {
  it('saves baseline and logs success', async () => {
    mockFetch.mockResolvedValue({});
    mockExtract.mockReturnValue({ 'charge.created': { properties: {} } });
    mockDiff.mockReturnValue({ added: {}, removed: {}, changed: {} });
    mockSave.mockReturnValue({ version: '2023-01-01', savedAt: '2023-01-01T00:00:00Z', diffs: {} });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await makeProgram().parseAsync(['node', 'cli', 'baseline', 'save', '2023-01-01']);
    expect(mockSave).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Baseline saved'));
    spy.mockRestore();
  });
});

describe('baseline compare', () => {
  it('prints comparison when baseline exists', async () => {
    mockFetch.mockResolvedValue({});
    mockExtract.mockReturnValue({ 'charge.created': {} });
    mockDiff.mockReturnValue({});
    mockLoad.mockReturnValue({ version: '2022-01-01', savedAt: '', diffs: {} });
    mockCompare.mockReturnValue({ baselineVersion: '2022-01-01', added: [], removed: [], changed: [] });
    mockFormat.mockReturnValue('comparison output');
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await makeProgram().parseAsync(['node', 'cli', 'baseline', 'compare', '2022-01-01', '2023-01-01']);
    expect(spy).toHaveBeenCalledWith('comparison output');
    spy.mockRestore();
  });

  it('exits when no baseline found', async () => {
    mockLoad.mockReturnValue(null);
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      makeProgram().parseAsync(['node', 'cli', 'baseline', 'compare', 'missing', '2023-01-01'])
    ).rejects.toThrow();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
