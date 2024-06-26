#!/usr/bin/env node

import { inputPackageManager } from './input-package-manager';
import { inputProjectName } from './input-project-name';
import path from 'node:path/posix';
import yargsParser from 'yargs-parser';
import { existsSync } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
import { Listr } from 'listr2';
import { promisify, styleText } from 'node:util';
import childProcess from 'node:child_process';
import { replaceVariables } from './replace-variables';

const argv = yargsParser(process.argv.slice(2));
const projectName = await inputProjectName(argv);
const packageManager = await inputPackageManager(argv);
const templateDir = path.join(import.meta.dirname, '..', 'templates');
const targetDir = path.resolve(projectName);

const exec = promisify(childProcess.exec);
const sleep = () => new Promise((resolve) => setTimeout(resolve, 500));

const spinner = new Listr([]);

spinner.add({
  title: '创建目录',
  task: async () => {
    if (existsSync(targetDir)) {
      await rm(targetDir, { recursive: true, force: true });
    }
    await mkdir(targetDir, { recursive: true });
    process.chdir(path.resolve(projectName));
  },
});

spinner.add({
  title: 'git初始化',
  task: async () => {
    await exec('git init');
    await sleep();
  },
});

spinner.add({
  title: '复制模板文件',
  task: async () => {
    await cp(templateDir, targetDir, { recursive: true });
    await replaceVariables('package.json', { projectName, packageManager });
    await replaceVariables('README.md', { projectName, packageManager });
    await sleep();
  },
});

spinner.add({
  title: '增加volta配置',
  skip: async () => {
    return !/\d\.\d/.test((await exec('volta -v')).stdout);
  },
  task: async () => {
    await exec('volta pin node');
    if (packageManager !== 'npm') {
      await exec(`volta pin ${packageManager}`);
    }
  },
});

spinner.add({
  title: '安装插件',
  task: async (_, task) => {
    const packages: { pkg: string; dev?: boolean }[] = [
      { pkg: '@aomex/core' },
      { pkg: '@aomex/web' },
      { pkg: '@aomex/console' },
      { pkg: '@aomex/router' },
      { pkg: '@aomex/cors' },
      { pkg: '@aomex/etag' },
      { pkg: '@aomex/compress' },
      { pkg: '@aomex/http-logger' },
      { pkg: '@aomex/commander' },
      { pkg: '@aomex/openapi' },
      { pkg: '@prisma/client' },
      { pkg: 'prisma', dev: true },
      { pkg: 'typescript', dev: true },
      { pkg: '@types/node', dev: true },
      { pkg: 'tsx', dev: true },
      { pkg: 'husky', dev: true },
      { pkg: 'tsc-alias', dev: true },
      { pkg: 'prettier', dev: true },
      { pkg: '@commitlint/cli', dev: true },
      { pkg: '@commitlint/config-conventional', dev: true },
      { pkg: 'eslint', dev: true },
      { pkg: '@typescript-eslint/eslint-plugin', dev: true },
      { pkg: '@typescript-eslint/parser', dev: true },
      { pkg: 'eslint-plugin-check-file', dev: true },
    ];
    const action = packageManager === 'npm' ? 'install' : 'add';
    const devSuffix = packageManager === 'npm' ? '--save-dev' : '-D';

    for (let i = 0; i < packages.length; ++i) {
      const { pkg, dev } = packages[i]!;
      task.title = '安装插件 ' + styleText('gray', pkg);
      await exec(`${packageManager} ${action} ${pkg} ${dev ? devSuffix : ''}`, {
        cwd: process.cwd(),
        env: process.env,
      });
    }
    task.title = '安装插件';
  },
});

spinner.add({
  title: '生成prisma/client文件',
  task: async () => {
    await exec('npx prisma generate');
    await sleep();
  },
});

await spinner.run();

console.log(
  '\n项目创建成功：' + styleText(['blue', 'underline'], process.cwd()) + '\n',
);
