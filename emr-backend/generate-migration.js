const { execFileSync } = require('child_process');
const { join } = require('path');

const nameArg = process.argv.find((arg) => arg.startsWith('--name='));
const migrationName = process.env.npm_config_name || nameArg?.split('=')[1];

if (!migrationName) {
  console.error(
    'Please provide a migration name like: npm run migration:generate -- --name=AddUserStatus',
  );
  process.exit(1);
}

if (!/^[A-Za-z][A-Za-z0-9]*$/.test(migrationName)) {
  console.error(
    'Migration name must be PascalCase or camelCase letters/numbers only, e.g. AddUserStatus',
  );
  process.exit(1);
}

const cliPath = join(__dirname, 'node_modules', 'typeorm', 'cli.js');
const migrationPath = `src/migrations/${migrationName}`;
const args = [
  '-r',
  'ts-node/register',
  '-r',
  'tsconfig-paths/register',
  cliPath,
  'migration:generate',
  migrationPath,
  '-d',
  'src/data-source.ts',
  '--pretty',
];

console.log(`Generating migration: ${migrationPath}`);
execFileSync(process.execPath, args, { stdio: 'inherit' });
