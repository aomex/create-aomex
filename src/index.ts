#!/usr/bin/env node

import path from 'node:path/posix';
import yargsParser from 'yargs-parser';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { terminal } from '@aomex/console';
import { execSync, spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { inputProject } from './input-project';
import { selectNodeVersion } from './select-node-version';

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

const argv = yargsParser(process.argv.slice(2));
const templateDir = path.join(import.meta.dirname, '..', 'templates');
const projectName = await inputProject(argv);
const pnpmVersion =
  execSync(`npm view pnpm version`, {
    encoding: 'utf8',
  }).replaceAll('\n', '') || '0.0.0';

const nodeVersion = await selectNodeVersion(argv);
const nodeMajorVersion = nodeVersion.split('.')[0]!;
const targetDir = path.resolve(projectName);

const { error } = await terminal.runTasks([
  {
    title: '创建目录',
    task: async () => {
      await mkdir(targetDir, { recursive: true });
      process.chdir(targetDir);
      await setTimeout(500);
    },
  },
  {
    title: '复制模板文件',
    task: async () => {
      let cronPort = '' + Math.max(1, Math.floor(3 * Math.random()));
      for (let i = 0; i < 4; ++i) {
        cronPort += Math.floor(10 * Math.random());
      }

      const variables = {
        projectName,
        nodeVersion,
        pnpmVersion,
        cronPort,
        nodeMajorVersion,
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
      // .gitignore这个文件在安装的时候总是被忽略
      await rename(
        path.join(targetDir, 'gitignore'),
        path.join(targetDir, '.gitignore'),
      );
      await setTimeout(500);
    },
  },
  {
    title: 'git初始化',
    skip: async () => {
      return !/\d\.\d/.test(execSync('git -v', { encoding: 'utf8' }));
    },
    task: async () => {
      await runShell('git init');
      await setTimeout(500);
    },
  },
  {
    title: '增加volta配置',
    skip: async () => {
      return !/\d\.\d/.test(execSync('volta -v', { encoding: 'utf8' }));
    },
    task: async () => {
      await runShell(`volta pin node@${nodeVersion}`);
      await runShell(`volta pin pnpm@${pnpmVersion}`);
    },
  },
  {
    title: '安装插件',
    task: async (_, task) => {
      const packages: { label: string; pkgs: string[]; dev?: boolean }[] = [
        {
          label: 'dependencies',
          pkgs: [
            '@aomex/common',
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
            '@aomex/auth',
            '@aomex/prisma',
            '@aomex/logger',
            'ioredis',
            'prisma', // docker prisma migrate 要用，放dev会导致二进制不存在
          ],
        },
        {
          label: 'dev dependencies',
          pkgs: [
            'typescript',
            'tsx',
            'tsc-alias',
            '@types/node',
            'husky',
            'prettier',
            '@commitlint/cli',
            '@commitlint/config-conventional',
            `@tsconfig/node${nodeMajorVersion}`,
          ],
          dev: true,
        },
      ];

      for (let i = 0; i < packages.length; ++i) {
        const { pkgs, dev, label } = packages[i]!;
        task.suffix = terminal.style('gray', label);
        await runShell(`pnpm add ${pkgs.join(' ')} ${dev ? '-D' : ''}`);
      }
      task.suffix = '';
    },
  },
  {
    title: '生成prisma客户端',
    task: async () => {
      await runShell('npx prisma generate');
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
    terminal.style('green', `cd ${projectName} && pnpm start`) +
    '\n',
);
