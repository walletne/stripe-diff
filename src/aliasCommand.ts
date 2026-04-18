import { Command } from 'commander';
import { addAlias, removeAlias, listAliases } from './diffAlias';
import { loadAliases, saveAliases } from './aliasStore';

export function registerAliasCommand(program: Command): void {
  const alias = program.command('alias').description('Manage version aliases');

  alias
    .command('set <alias> <version>')
    .description('Define an alias for a Stripe API version')
    .action((name: string, version: string) => {
      const map = loadAliases();
      const updated = addAlias(name, version, map);
      saveAliases(updated);
      console.log(`Alias "${name}" => ${version} saved.`);
    });

  alias
    .command('remove <alias>')
    .description('Remove an alias')
    .action((name: string) => {
      const map = loadAliases();
      const updated = removeAlias(name, map);
      saveAliases(updated);
      console.log(`Alias "${name}" removed.`);
    });

  alias
    .command('list')
    .description('List all defined aliases')
    .action(() => {
      const map = loadAliases();
      console.log(listAliases(map));
    });
}
