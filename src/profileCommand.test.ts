import { Command } from 'commander';
import { registerProfileCommand } from './profileCommand';
import * as cachedFetchMod from './cachedFetch';
import * as parseSchema from './parseSchema';
import * as diffSchema from './diffSchema';
import * as diffProfile from './diffProfile';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerProfileCommand(program);
  return program;
}

describe('registerProfileCommand', () => {
  beforeEach(() => {
    jest.spyOn(cachedFetchMod, 'cachedFetch').mockResolvedValue({} as any);
    jest.spyOn(parseSchema, 'extractEventSchemas').mockReturnValue({});
    jest.spyOn(diffSchema, 'diffEventSchemas').mockReturnValue({});
    jest.spyOn(diffProfile, 'buildProfile').mockReturnValue({
      name: 'test', createdAt: 'now', versions: ['a', 'b'],
      eventCount: 0, addedFields: 0, removedFields: 0, changedFields: 0,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('calls formatProfile by default', async () => {
    const spy = jest.spyOn(diffProfile, 'formatProfile').mockReturnValue('text output');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'cli', 'profile', 'myprofile', '2023-01-01', '2024-01-01']);
    expect(spy).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('text output');
  });

  it('calls formatProfileJson with --json flag', async () => {
    const spy = jest.spyOn(diffProfile, 'formatProfileJson').mockReturnValue('{"name":"test"}');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'cli', 'profile', 'myprofile', 'a', 'b', '--json']);
    expect(spy).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('{"name":"test"}');
  });

  it('exits on error', async () => {
    jest.spyOn(cachedFetchMod, 'cachedFetch').mockRejectedValue(new Error('network fail'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(makeProgram().parseAsync(['node', 'cli', 'profile', 'p', 'a', 'b'])).rejects.toThrow();
    expect(errSpy).toHaveBeenCalledWith('Error:', 'network fail');
  });
});
