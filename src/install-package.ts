import { PackageManager } from './input-package-manager';
import { Orm } from './input-orm';
import childProcess from 'child_process';
import { promisify } from 'util';
import { Tool } from './input-tools';
import { ora } from './execute';
import chalk from 'chalk';

export interface PackageCollection {
  deps: string[];
  devDeps: string[];
}

const exec = promisify(childProcess.exec);

export const installPackage = async (
  packageManager: PackageManager,
  { deps, devDeps }: PackageCollection,
) => {
  const act = packageManager === 'npm' ? 'install' : 'add';
  const devSuffix = packageManager === 'npm' ? '--save-dev' : '-D';
  const step = 4;

  for (let i = 0; i < deps.length; i += step) {
    const pkgs = deps.slice(i, i + step).join(' ');
    ora.suffixText = chalk.gray(pkgs);
    await exec(`${packageManager} ${act} ${pkgs}`, { cwd: process.cwd() });
  }

  for (let i = 0; i < devDeps.length; i += step) {
    const pkgs = devDeps.slice(i, i + step).join(' ');
    ora.suffixText = chalk.gray(pkgs + ' [dev]');
    await exec(`${packageManager} ${act} ${pkgs} ${devSuffix}`, {
      cwd: process.cwd(),
    });
  }
};

export const getCommonPackages = (): PackageCollection => {
  return {
    deps: [
      '@aomex/core',
      '@aomex/service',
      // Web
      '@aomex/web',
      '@aomex/router',
      '@aomex/cors',
      '@aomex/compress',
      '@aomex/logger',
      // Console
      '@aomex/console',
      '@aomex/commander',
    ],
    devDeps: [
      'typescript',
      '@types/node',
      // Web
      'ts-node',
      'nodemon',
    ],
  };
};

export const getPackagesFromOrm = (orm: Orm): PackageCollection => {
  switch (orm) {
    case 'prisma':
      return {
        deps: ['@aomex/prisma-model', '@prisma/client'],
        devDeps: ['prisma'],
      };
    case '-':
      return {
        deps: [],
        devDeps: [],
      };
    default:
      throw new Error('Unknown orm: ' + orm);
  }
};

export const getPackagesFromTools = (tools: Tool[]): PackageCollection => {
  const packages: PackageCollection = {
    deps: [],
    devDeps: [],
  };
  tools.forEach((tool) => {
    switch (tool) {
      case 'prettier':
        packages.devDeps.push('prettier');
        break;
      case 'commitlint':
        packages.devDeps.push(
          '@commitlint/cli',
          '@commitlint/config-conventional',
          'husky',
        );
        break;
      default:
        throw new Error('Unknown tool: ' + tool);
    }
  });

  return packages;
};
