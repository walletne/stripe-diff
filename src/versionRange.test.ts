import { parseVersionRange, validateVersionRange } from './versionRange';
import * as versionList from './versionList';

jest.mock('./versionList');

const mockValidateVersions = versionList.validateVersions as jest.MockedFunction<
  typeof versionList.validateVersions
>;

describe('parseVersionRange', () => {
  it('parses a valid range string', () => {
    const result = parseVersionRange('2020-08-27..2022-11-15');
    expect(result).toEqual({ from: '2020-08-27', to: '2022-11-15' });
  });

  it('trims whitespace around versions', () => {
    const result = parseVersionRange(' 2020-08-27 .. 2022-11-15 ');
    expect(result).toEqual({ from: '2020-08-27', to: '2022-11-15' });
  });

  it('throws on missing separator', () => {
    expect(() => parseVersionRange('2020-08-27')).toThrow('Invalid version range');
  });

  it('throws on empty parts', () => {
    expect(() => parseVersionRange('..2022-11-15')).toThrow('Invalid version range');
    expect(() => parseVersionRange('2020-08-27..')).toThrow('Invalid version range');
  });
});

describe('validateVersionRange', () => {
  const knownVersions = ['2019-12-03', '2020-08-27', '2022-11-15', '2023-10-16'];

  beforeEach(() => {
    mockValidateVersions.mockResolvedValue(knownVersions);
  });

  afterEach(() => jest.resetAllMocks());

  it('resolves for a valid range', async () => {
    await expect(
      validateVersionRange({ from: '2020-08-27', to: '2022-11-15' })
    ).resolves.toBeUndefined();
  });

  it('throws when from version is unknown', async () => {
    await expect(
      validateVersionRange({ from: '2021-01-01', to: '2022-11-15' })
    ).rejects.toThrow('Unknown Stripe API version: "2021-01-01"');
  });

  it('throws when to version is unknown', async () => {
    await expect(
      validateVersionRange({ from: '2020-08-27', to: '2099-01-01' })
    ).rejects.toThrow('Unknown Stripe API version: "2099-01-01"');
  });

  it('throws when from is newer than to', async () => {
    await expect(
      validateVersionRange({ from: '2022-11-15', to: '2020-08-27' })
    ).rejects.toThrow('must be older than');
  });

  it('throws when from and to are the same version', async () => {
    await expect(
      validateVersionRange({ from: '2022-11-15', to: '2022-11-15' })
    ).rejects.toThrow('must be older than');
  });
});
