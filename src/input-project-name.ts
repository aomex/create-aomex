import inquirer from 'inquirer';
import kebabCase from 'lodash.kebabcase';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const inputProjectName = async (
  argv: Record<string, any>,
): Promise<string> => {
  if (typeof argv['name'] === 'string') return argv['name'];

  const result = await inquirer.prompt<{ projectName: string }>({
    name: 'projectName',
    type: 'input',
    message: 'Project name',
    suffix: ':',
  });

  const projectName = kebabCase(result.projectName);

  const absolutePath = path.posix.resolve(projectName);
  if (existsSync(absolutePath) && argv['force'] !== true) {
    const { goon } = await inquirer.prompt<{ goon: boolean }>({
      name: 'goon',
      type: 'confirm',
      message: `Project "${projectName}" has been created, want to dangerously override it?`,
      suffix: ':',
    });

    if (!goon) {
      process.exit(0);
    }
  }

  return projectName;
};
