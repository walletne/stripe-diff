import { Command } from 'commander';
import { registerScoreCommand } from './scoreCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerScoreCommand(program);
  return program;
}

describe('registerScoreCommand', () => {
  it('registers the score command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'score');
    expect(cmd).toBeDefined();
  });

  it('has correct description', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'score')!;
    expect(cmd.description()).toMatch(/score/i);
  });

  it('supports --json flag', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'score')!;
    const jsonOpt = cmd.options.find(o => o.long === '--json');
    expect(jsonOpt).toBeDefined();
  });

  it('supports --event option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'score')!;
    const eventOpt = cmd.options.find(o => o.long === '--event');
    expect(eventOpt).toBeDefined();
  });

  it('supports --range option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'score')!;
    const rangeOpt = cmd.options.find(o => o.long === '--range');
    expect(rangeOpt).toBeDefined();
  });
});
