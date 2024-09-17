#!/usr/bin/env node

import path from 'node:path/posix';
import yargsParser from 'yargs-parser';
import { existsSync } from 'node:fs';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { terminal } from '@aomex/console';
import { execSync, spawn } from 'node:child_process';
import kebabCase from 'lodash.kebabcase';

const argv = yargsParser(process.argv.slice(2));
const templateDir = path.join(import.meta.dirname, '..', 'templates');

const projectName = kebabCase(argv['project'] || 'my-aomex-project');
const targetDir = path.resolve(projectName);
if (existsSync(targetDir)) {
  terminal.printError(`目录 "${targetDir}" 已存在！`);
  process.exit(1);
}
const nodeVersion = process.versions.node;

let packageManager: 'pnpm' | 'yarn' | 'npm' = 'pnpm';
for (const item of <const>['pnpm', 'npm', 'yarn']) {
  if (argv[item]) {
    packageManager = item;
    break;
  }
}

const packageManagerVersion =
  execSync(
    packageManager === 'npm' ? 'npm -v' : `npm view ${packageManager} version`,
    { encoding: 'utf8' },
  ).replaceAll('\n', '') || '0.0.0';

const runShell = async (command: string) => {
  await new Promise((resolve, reject) => {
    const stream = spawn(command, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
    });
    stream.on('close', resolve);
    stream.on('error', reject);
  });
};
const sleep = () => new Promise((resolve) => setTimeout(resolve, 500));

const { error } = await terminal.runTasks([
  {
    title: '创建目录',
    task: async () => {
      if (existsSync(targetDir)) {
        await rm(targetDir, { recursive: true, force: true });
      }
      await mkdir(targetDir, { recursive: true });
      process.chdir(path.resolve(projectName));
    },
  },
  {
    title: '复制模板文件',
    task: async () => {
      const variables = {
        projectName,
        packageManager,
        nodeVersion,
        packageManagerVersion,
      };
      await cp(templateDir, targetDir, { recursive: true });
      const files = await readdir(targetDir, { recursive: true });
      for (const file of files) {
        const isFile = (await stat(path.join(targetDir, file))).isFile();
        if (!isFile) continue;
        const fileAbsolutePath = path.resolve(file);
        let fileContent = await readFile(fileAbsolutePath, 'utf8');
        Object.entries(variables).forEach(([key, value]) => {
          fileContent = fileContent.replaceAll(`{{${key}}}`, value);
        });
        await writeFile(fileAbsolutePath, fileContent);
      }
      await sleep();
    },
  },
  {
    title: 'git初始化',
    skip: async () => {
      return !/\d\.\d/.test(execSync('git -v', { encoding: 'utf8' }));
    },
    task: async () => {
      await runShell('git init');
      await sleep();
    },
  },
  {
    title: '增加volta配置',
    skip: async () => {
      return !/\d\.\d/.test(execSync('volta -v', { encoding: 'utf8' }));
    },
    task: async () => {
      await runShell(`volta pin node@${nodeVersion}`);
      if (packageManager !== 'npm') {
        await runShell(`volta pin ${packageManager}@${packageManagerVersion}`);
      }
    },
  },
  {
    title: '安装插件',
    task: async (_, task) => {
      const packages: { label: string; pkgs: string[]; dev?: boolean }[] = [
        {
          label: 'dependencies',
          pkgs: [
            '@aomex/core',
            '@aomex/web',
            '@aomex/cors',
            '@aomex/etag',
            '@aomex/compress',
            '@aomex/http-logger',
            '@aomex/response-time',
            '@aomex/console',
            '@aomex/cron',
            '@aomex/helmet',
            '@aomex/openapi',
            '@aomex/swagger-ui',
            '@aomex/async-trace',
            '@prisma/client',
            '@aomex/cache',
            '@aomex/cache-redis-adapter',
            'ioredis',
          ],
        },
        {
          label: 'dev dependencies',
          pkgs: [
            'prisma',
            'typescript',
            'tsx',
            'tsc-alias',
            '@types/node',
            'husky',
            'prettier',
            '@commitlint/cli',
            '@commitlint/config-conventional',
            'eslint',
            '@typescript-eslint/eslint-plugin',
            '@typescript-eslint/parser',
            'eslint-plugin-check-file',
          ],
          dev: true,
        },
      ];
      const action = packageManager === 'npm' ? 'install' : 'add';
      const devSuffix = packageManager === 'npm' ? '--save-dev' : '-D';

      for (let i = 0; i < packages.length; ++i) {
        const { pkgs, dev, label } = packages[i]!;
        task.suffix = terminal.style('gray', label);
        await runShell(
          `${packageManager} ${action} ${pkgs.join(' ')} ${
            dev ? devSuffix : ''
          }`,
        );
      }
      task.suffix = '';
    },
  },
  {
    title: '生成prisma客户端',
    task: async () => {
      await runShell('npx prisma generate');
      await sleep();
    },
  },
]);

if (error) process.exit(1);

console.log(
  '\n项目创建成功：' +
    terminal.style(['blue', 'underline'], process.cwd()) +
    '\n' +
    '启动项目可执行如下指令：' +
    '\n\n' +
    terminal.style('green', `cd ${projectName} && ${packageManager} start`) +
    '\n',
);
