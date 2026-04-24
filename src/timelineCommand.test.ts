import { Command } from 'commander';
import { registerTimelineCommand } from './timelineCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTimelineCommand(program);
  return program;
}

describe('registerTimelineCommand', () => {
  it('registers the timeline command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'timeline');
    expect(cmd).toBeDefined();
  });

  it('timeline command accepts versionRange argument', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'timeline')!;
    expect(cmd).toBeDefined();
    const args = cmd.registeredArguments;
    expect(args.length).toBeGreaterThanOrEqual(1);
    expect(args[0].name()).toBe('versionRange');
  });

  it('timeline command has --json option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'timeline')!;
    const jsonOpt = cmd.options.find(o => o.long === '--json');
    expect(jsonOpt).toBeDefined();
  });

  it('has a description', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'timeline')!;
    expect(cmd.description()).toBeTruthy();
  });
});
