import { execSync } from 'child_process';
import * as fetchSchemaModule from './fetchSchema';
import * as parseSchemaModule from './parseSchema';
import * as diffSchemaModule from './diffSchema';
import * as formatDiffModule from './formatDiff';

jest.mock('./fetchSchema');
jest.mock('./parseSchema');
jest.mock('./diffSchema');
jest.mock('./formatDiff');

const mockFetchSchema = fetchSchemaModule.fetchSchema as jest.MockedFunction<typeof fetchSchemaModule.fetchSchema>;
const mockExtractEventSchemas = parseSchemaModule.extractEventSchemas as jest.MockedFunction<typeof parseSchemaModule.extractEventSchemas>;
const mockDiffEventSchemas = diffSchemaModule.diffEventSchemas as jest.MockedFunction<typeof diffSchemaModule.diffEventSchemas>;
const mockFormatDiff = formatDiffModule.formatDiff as jest.MockedFunction<typeof formatDiffModule.formatDiff>;
const mockFormatSummary = formatDiffModule.formatSummary as jest.MockedFunction<typeof formatDiffModule.formatSummary>;

const sampleDiff = {
  event: 'payment_intent.created',
  added: [{ path: 'data.object.amount', type: 'integer' }],
  removed: [],
  changed: [],
};

beforeEach(() => {
  jest.resetAllMocks();
  mockFetchSchema.mockResolvedValue({});
  mockExtractEventSchemas.mockReturnValue({});
  mockDiffEventSchemas.mockReturnValue([sampleDiff]);
  mockFormatDiff.mockReturnValue('formatted diff');
  mockFormatSummary.mockReturnValue('summary');
});

describe('cli diff command', () => {
  it('calls fetchSchema for both versions', async () => {
    const { runDiff } = await import('./cliRunner');
    await runDiff('2022-08-01', '2023-10-16', {});
    expect(mockFetchSchema).toHaveBeenCalledWith('2022-08-01');
    expect(mockFetchSchema).toHaveBeenCalledWith('2023-10-16');
  });

  it('filters diffs by event when --event option is provided', async () => {
    const { runDiff } = await import('./cliRunner');
    mockDiffEventSchemas.mockReturnValue([
      sampleDiff,
      { event: 'charge.created', added: [], removed: [], changed: [] },
    ]);
    const result = await runDiff('2022-08-01', '2023-10-16', { event: 'payment_intent.created' });
    expect(result).toHaveLength(1);
    expect(result[0].event).toBe('payment_intent.created');
  });

  it('returns all diffs when no event filter is given', async () => {
    const { runDiff } = await import('./cliRunner');
    mockDiffEventSchemas.mockReturnValue([sampleDiff, { event: 'charge.created', added: [], removed: [], changed: [] }]);
    const result = await runDiff('2022-08-01', '2023-10-16', {});
    expect(result).toHaveLength(2);
  });
});
