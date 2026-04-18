import { addPin, listPins, removePin, findPin, formatPinTable } from './diffPin';
import * as cache from './cache';

jest.mock('./cache');

const mockRead = cache.readCache as jest.MockedFunction<typeof cache.readCache>;
const mockWrite = cache.writeCache as jest.MockedFunction<typeof cache.writeCache>;

beforeEach(() => {
  jest.clearAllMocks();
  mockWrite.mockResolvedValue(undefined);
});

test('listPins returns empty array when no cache', async () => {
  mockRead.mockResolvedValue(null);
  const pins = await listPins();
  expect(pins).toEqual([]);
});

test('addPin stores a new pin with id and createdAt', async () => {
  mockRead.mockResolvedValue([]);
  const pin = await addPin({ label: 'test', fromVersion: '2022-01-01', toVersion: '2023-01-01' });
  expect(pin.id).toMatch(/^pin_/);
  expect(pin.label).toBe('test');
  expect(pin.createdAt).toBeTruthy();
  expect(mockWrite).toHaveBeenCalledWith('pinned-diffs', [pin]);
});

test('removePin removes existing pin', async () => {
  const existing = { id: 'pin_1', label: 'a', fromVersion: '2022-01-01', toVersion: '2023-01-01', createdAt: '' };
  mockRead.mockResolvedValue([existing]);
  const result = await removePin('pin_1');
  expect(result).toBe(true);
  expect(mockWrite).toHaveBeenCalledWith('pinned-diffs', []);
});

test('removePin returns false for unknown id', async () => {
  mockRead.mockResolvedValue([]);
  const result = await removePin('pin_999');
  expect(result).toBe(false);
  expect(mockWrite).not.toHaveBeenCalled();
});

test('findPin returns matching pin', async () => {
  const existing = { id: 'pin_2', label: 'b', fromVersion: '2022-01-01', toVersion: '2023-01-01', createdAt: '' };
  mockRead.mockResolvedValue([existing]);
  const pin = await findPin('pin_2');
  expect(pin).toEqual(existing);
});

test('formatPinTable shows no pins message', () => {
  expect(formatPinTable([])).toBe('No pinned diffs.');
});

test('formatPinTable renders rows', () => {
  const pins = [{ id: 'pin_1', label: 'my pin', fromVersion: '2022-01-01', toVersion: '2023-01-01', eventType: 'charge.updated', createdAt: '' }];
  const out = formatPinTable(pins);
  expect(out).toContain('pin_1');
  expect(out).toContain('my pin');
  expect(out).toContain('charge.updated');
});
