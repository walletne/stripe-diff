import { Command } from 'commander';
import { registerSignatureCommand } from './signatureCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSignatureCommand(program);
  return program;
}

describe('registerSignatureCommand', () => {
  it('registers the signature command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'signature');
    expect(cmd).toBeDefined();
  });

  it('has expected options', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'signature')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--event');
    expect(optNames).toContain('--json');
    expect(optNames).toContain('--output');
  });

  it('requires two version arguments', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'signature')!;
    expect(cmd.registeredArguments.length).toBe(2);
  });
});
