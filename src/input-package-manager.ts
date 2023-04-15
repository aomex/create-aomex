import inquirer from 'inquirer';

const packageManagers = <const>['pnpm', 'yarn', 'npm'];

export type PackageManager = typeof packageManagers[number];

export const inputPackageManager = async (
  argv: Record<string, any>,
): Promise<PackageManager> => {
  for (const expected of packageManagers) {
    if (argv[expected]) return expected;
  }

  const { manager } = await inquirer.prompt<{
    manager: PackageManager;
  }>({
    name: 'manager',
    message: 'Select a package manager',
    type: 'list',
    choices: packageManagers,
    default: 'pnpm',
    askAnswered: true,
  });

  return manager;
};
