import { inputPackageManager } from './input-package-manager';
import { inputProjectName } from './input-project-name';
import path from 'node:path/posix';
import { copyTemplate } from './copy-template';
import { updatePackageName } from './update-package-name';
import { inputTools } from './input-tools';
import { inputOrm } from './input-orm';
import chalk from 'chalk';
import yargsParser from 'yargs-parser';
import {
  getCommonPackages,
  getPackagesFromOrm,
  getPackagesFromTools,
  installPackage,
} from './install-package';
import { execute } from './execute';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { vscodeAddExtension, vscodeAddSetting } from './vscode';
import { addScriptCommand } from './add-script-command';

const argv = yargsParser(process.argv.slice(2));

const projectName = await inputProjectName(argv);
const packageManager = await inputPackageManager(argv);
const orm = await inputOrm(argv);
const tools = await inputTools(argv);

const templateDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'templates',
);

{
  const targetDir = path.resolve(projectName);
  if (existsSync(targetDir)) {
    await rm(targetDir, { recursive: true, force: true });
  }
  await mkdir(targetDir, { recursive: true });
  process.chdir(path.resolve(projectName));
}

await execute('Git initialize', async (exec) => {
  await exec('git init');
});

await execute('Copy template files', async () => {
  await Promise.all([
    copyTemplate(path.join(templateDir, 'common')),
    copyTemplate(path.join(templateDir, 'platform-web')),
    copyTemplate(path.join(templateDir, 'platform-console')),
  ]);

  if (orm !== '-') {
    await copyTemplate(path.join(templateDir, 'orm-' + orm));
  }

  await Promise.all(
    tools.map((tool) => {
      return copyTemplate(path.join(templateDir, 'tool-' + tool));
    }),
  );
});

await execute('Pre settings', async () => {
  await addScriptCommand('preinstall', 'npx only-allow ' + packageManager);
  await updatePackageName(projectName);

  if (tools.includes('commitlint')) {
    await addScriptCommand('prepare', 'npx husky install');
  }
});

await execute('Install packages', async () => {
  const install = installPackage.bind(null, packageManager);
  await install(getCommonPackages());
  await install(getPackagesFromOrm(orm));
  await install(getPackagesFromTools(tools));
});

if (orm === 'prisma') {
  await execute('Generate prisma client', async (exec) => {
    await exec('./node_modules/.bin/prisma generate');
  });
}

await execute('Post settings', async (exec) => {
  await exec('./node_modules/.bin/aomex --init');

  if (orm === 'prisma') {
    await vscodeAddExtension('prisma.prisma');
  }

  if (tools.includes('prettier')) {
    await Promise.all([
      vscodeAddExtension('esbenp.prettier-vscode'),
      vscodeAddSetting({
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
      }),
    ]);
  }
});

console.log('\nProject has been created: ' + chalk.blue(process.cwd()) + '\n');
