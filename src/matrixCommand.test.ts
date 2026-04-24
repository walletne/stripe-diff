import { Command } from 'commander';
import { registerMatrixCommand } from './matrixCommand';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerMatrixCommand(program);
  return program;
}

describe('registerMatrixCommand', () => {
  it('registers the matrix command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'matrix');
    expect(cmd).toBeDefined();
  });

  it('matrix command has expected options', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'matrix')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--format');
    expect(optNames).toContain('--output');
    expect(optNames).toContain('--filter');
  });

  it('matrix command description mentions matrix', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'matrix')!;
    expect(cmd.description().toLowerCase()).toContain('matrix');
  });
});
