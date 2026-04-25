import { Command } from 'commander';
import { registerAuditCommand } from './auditCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerAuditCommand(program);
  return program;
}

describe('registerAuditCommand', () => {
  it('registers the audit command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'audit');
    expect(cmd).toBeDefined();
  });

  it('has expected options', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'audit')!;
    const optNames = cmd.options.map((o) => o.long);
    expect(optNames).toContain('--event');
    expect(optNames).toContain('--format');
    expect(optNames).toContain('--output');
  });

  it('defaults format to text', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'audit')!;
    const formatOpt = cmd.options.find((o) => o.long === '--format');
    expect(formatOpt?.defaultValue).toBe('text');
  });

  it('has a description', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'audit')!;
    expect(cmd.description()).toBeTruthy();
  });
});
