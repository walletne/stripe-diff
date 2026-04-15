import { runDiff, runList } from './cliRunner';
import * as fetchSchemaModule from './fetchSchema';
import * as parseSchemaModule from './parseSchema';
import * as diffSchemaModule from './diffSchema';

jest.mock('./fetchSchema');
jest.mock('./parseSchema');
jest.mock('./diffSchema');

const mockFetchSchema = fetchSchemaModule.fetchSchema as jest.MockedFunction<typeof fetchSchemaModule.fetchSchema>;
const mockExtractEventSchemas = parseSchemaModule.extractEventSchemas as jest.MockedFunction<typeof parseSchemaModule.extractEventSchemas>;
const mockDiffEventSchemas = diffSchemaModule.diffEventSchemas as jest.MockedFunction<typeof diffSchemaModule.diffEventSchemas>;

const sampleDiffs = [
  { event: 'payment_intent.created', added: [], removed: [], changed: [] },
  { event: 'charge.updated', added: [{ path: 'data.object.amount', type: 'integer' }], removed: [], changed: [] },
];

beforeEach(() => {
  jest.resetAllMocks();
  mockFetchSchema.mockResolvedValue({});
  mockExtractEventSchemas.mockReturnValue({
    'payment_intent.created': {},
    'charge.updated': {},
  });
  mockDiffEventSchemas.mockReturnValue(sampleDiffs);
});

describe('runDiff', () => {
  it('fetches schemas for both versions', async () => {
    await runDiff('2022-08-01', '2023-10-16', {});
    expect(mockFetchSchema).toHaveBeenCalledTimes(2);
    expect(mockFetchSchema).toHaveBeenCalledWith('2022-08-01');
    expect(mockFetchSchema).toHaveBeenCalledWith('2023-10-16');
  });

  it('returns all diffs when no event filter', async () => {
    const result = await runDiff('2022-08-01', '2023-10-16', {});
    expect(result).toHaveLength(2);
  });

  it('filters by event when option provided', async () => {
    const result = await runDiff('2022-08-01', '2023-10-16', { event: 'charge.updated' });
    expect(result).toHaveLength(1);
    expect(result[0].event).toBe('charge.updated');
  });

  it('returns empty array when event filter matches nothing', async () => {
    const result = await runDiff('2022-08-01', '2023-10-16', { event: 'nonexistent.event' });
    expect(result).toHaveLength(0);
  });
});

describe('runList', () => {
  it('fetches schema for the given version', async () => {
    await runList('2023-10-16');
    expect(mockFetchSchema).toHaveBeenCalledWith('2023-10-16');
  });

  it('returns sorted event names', async () => {
    mockExtractEventSchemas.mockReturnValue({
      'payment_intent.created': {},
      'account.updated': {},
      'charge.created': {},
    });
    const result = await runList('2023-10-16');
    expect(result).toEqual(['account.updated', 'charge.created', 'payment_intent.created']);
  });
});
