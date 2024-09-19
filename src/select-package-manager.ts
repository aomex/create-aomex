import { select } from '@inquirer/prompts';
import { execSync } from 'node:child_process';

const packageManagers = <const>['pnpm', 'npm', 'yarn'];

export const selectPackageManager = async (argv: Record<string, any>) => {
  let packageManager!: (typeof packageManagers)[number];
  for (const item of <const>['pnpm', 'npm', 'yarn']) {
    if (argv[item]) {
      packageManager = item;
      break;
    }
  }
  if (!packageManager) {
    packageManager = await select({
      message: '请选择包管理器',
      default: 'pnpm',
      choices: packageManagers,
    });
  }

  const packageManagerVersion =
    execSync(
      packageManager === 'npm'
        ? 'npm -v'
        : `npm view ${packageManager} version`,
      { encoding: 'utf8' },
    ).replaceAll('\n', '') || '0.0.0';

  return { packageManager, packageManagerVersion };
};
