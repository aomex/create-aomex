import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const exampleRoot = join(import.meta.dirname, '../example');
const dirs = readdirSync(exampleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(exampleRoot, name, 'tsconfig.json')))
  .sort();

let failed = false;

for (const name of dirs) {
  const project = join('example', name);
  console.log(`\n▶ tsc -p ${project} --noEmit`);
  const result = spawnSync('tsc', ['-p', project, '--noEmit'], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
