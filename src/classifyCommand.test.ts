import { Command } from 'commander';
import { registerClassifyCommand } from './classifyCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerClassifyCommand(program);
  return program;
}

describe('registerClassifyCommand', () => {
  it('registers classify command on program', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'classify');
    expect(cmd).toBeDefined();
  });

  it('has expected options', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'classify')!;
    const optionNames = cmd.options.map((o) => o.long);
    expect(optionNames).toContain('--event');
    expect(optionNames).toContain('--format');
    expect(optionNames).toContain('--output');
  });

  it('requires two version arguments', () => {
    const program = makeProgram();
    expect(() =>
      program.parse(['node', 'test', 'classify'], { from: 'user' })
    ).toThrow();
  });
});
