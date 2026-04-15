import { fetchSchema } from './fetchSchema';
import https from 'https';
import { EventEmitter } from 'events';

jest.mock('https');

const mockHttpsGet = https.get as jest.Mock;

function createMockResponse(statusCode: number, body: string) {
  const res = new EventEmitter() as any;
  res.statusCode = statusCode;
  process.nextTick(() => {
    res.emit('data', Buffer.from(body));
    res.emit('end');
  });
  return res;
}

function createMockRequest() {
  const req = new EventEmitter() as any;
  return req;
}

describe('fetchSchema', () => {
  afterEach(() => jest.resetAllMocks());

  it('resolves with parsed JSON when status is 200', async () => {
    const payload = { openapi: '3.0.0', components: {} };
    const req = createMockRequest();
    mockHttpsGet.mockImplementation((_url: string, cb: Function) => {
      cb(createMockResponse(200, JSON.stringify(payload)));
      return req;
    });

    const result = await fetchSchema('2024-06-20');
    expect(result).toEqual(payload);
  });

  it('falls back to master when status is 404', async () => {
    const fallbackPayload = { openapi: '3.0.0', info: { version: 'master' } };
    let callCount = 0;
    const req = createMockRequest();

    mockHttpsGet.mockImplementation((_url: string, cb: Function) => {
      callCount++;
      if (callCount === 1) {
        cb(createMockResponse(404, ''));
      } else {
        cb(createMockResponse(200, JSON.stringify(fallbackPayload)));
      }
      return req;
    });

    const result = await fetchSchema('9999-01-01');
    expect(result).toEqual(fallbackPayload);
    expect(callCount).toBe(2);
  });

  it('rejects when status is not 200 or 404', async () => {
    const req = createMockRequest();
    mockHttpsGet.mockImplementation((_url: string, cb: Function) => {
      cb(createMockResponse(500, ''));
      return req;
    });

    await expect(fetchSchema('2024-06-20')).rejects.toThrow('HTTP 500');
  });

  it('rejects when response body is invalid JSON', async () => {
    const req = createMockRequest();
    mockHttpsGet.mockImplementation((_url: string, cb: Function) => {
      cb(createMockResponse(200, 'not-json'));
      return req;
    });

    await expect(fetchSchema('2024-06-20')).rejects.toThrow('Failed to parse schema JSON');
  });
});
