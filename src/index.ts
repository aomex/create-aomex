#!/usr/bin/env node

import path from 'node:path/posix';
import yargsParser from 'yargs-parser';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { terminal } from '@aomex/console';
import { execSync, spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { inputProject } from './input-project';
import { selectNodeVersion } from './select-node-version';
import { selectOptions } from './select-options';
import { applyScaffoldVariables, generateProjectFiles } from './project-files';
import {
  packageManagerExec,
  resolveAomexVersion,
  resolvePackageManagerVersion,
  resolvePrismaVersion,
} from './generators';

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

const isExitPromptError = (err: unknown): boolean =>
  err instanceof Error && err.name === 'ExitPromptError';

const main = async () => {
  const argv = yargsParser(process.argv.slice(2));
  const projectName = await inputProject(argv);
  const nodeVersion = await selectNodeVersion(argv);
  const options = await selectOptions(argv);
  const packageManagerVersion = await resolvePackageManagerVersion(
    options.packageManager,
  );
  const aomexVersion = await resolveAomexVersion();
  const prismaVersion =
    options.orm === 'prisma' ? await resolvePrismaVersion() : undefined;
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
      title: '生成项目文件',
      task: async () => {
        const variables: Record<string, string> = {
          projectName,
          nodeVersion,
          pnpmVersion: packageManagerVersion,
          nodeMajorVersion: nodeVersion.split('.')[0]!,
        };

        const files = generateProjectFiles({
          projectName,
          options,
          packageManagerVersion,
          aomexVersion,
          prismaVersion,
        });

        for (const [relPath, file] of Object.entries(files)) {
          const content = applyScaffoldVariables(file.content, variables);
          const abs = path.resolve(relPath);
          await mkdir(path.dirname(abs), { recursive: true });
          await writeFile(abs, content);
          if (file.mode !== undefined) {
            await chmod(abs, file.mode);
          }
        }

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
      title: '安装依赖',
      task: async () => {
        const pm = options.packageManager;
        const cmd =
          pm === 'pnpm'
            ? 'pnpm install'
            : pm === 'yarn'
              ? 'yarn'
              : 'npm install';
        await runShell(cmd);

        if (pm === 'pnpm') {
          await runShell('pnpm approve-builds --all -y');
        }
      },
    },
    {
      title: '生成prisma客户端',
      skip: async () => options.orm !== 'prisma',
      task: async () => {
        const exec = packageManagerExec(options.packageManager);
        await runShell(`${exec} prisma generate`);
      },
    },
    {
      title: '格式化代码',
      task: async () => {
        const exec = packageManagerExec(options.packageManager);
        await runShell(`${exec} prettier --cache --write .`);
      },
    },
  ]);

  if (error) process.exit(1);

  const startCmd =
    options.packageManager === 'npm'
      ? `npm start`
      : options.packageManager === 'yarn'
        ? `yarn start`
        : `pnpm start`;

  console.log(
    '\n项目创建成功：' +
      terminal.style(['blue', 'underline'], process.cwd()) +
      '\n' +
      '启动项目可执行如下指令：' +
      '\n\n' +
      terminal.style('green', `cd ${projectName} && ${startCmd}`) +
      '\n',
  );
};

main().catch((err) => {
  if (isExitPromptError(err)) {
    process.exit(0);
  }
  throw err;
});
