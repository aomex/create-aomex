#!/usr/bin/env node

import path from 'node:path/posix';
import { createRequire } from 'node:module';
import yargsParser from 'yargs-parser';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { terminal } from './terminal';
import { execSync, spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { inputProject } from './input-project';
import { selectNodeVersion } from './select-node-version';
import { selectOptions } from './select-options';
import { applyScaffoldVariables, generateProjectFiles } from './project-files';
import { ensureLatestCreateAomex } from './ensure-latest';
import {
  packageManagerExec,
  resolveAomexContribVersions,
  resolveAomexVersion,
  resolvePackageManagerVersion,
  resolvePrismaVersion,
} from './generators';

const { version: createAomexVersion } = createRequire(import.meta.url)(
  '../package.json',
) as { version: string };

const runShell = async (command: string) => {
  await new Promise<void>((resolve, reject) => {
    const stream = spawn(command, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
      stdio: 'inherit',
    });
    stream.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`命令失败 (${code}): ${command}`));
    });
    stream.on('error', reject);
  });
};

const isExitPromptError = (err: unknown): boolean =>
  err instanceof Error && err.name === 'ExitPromptError';

const main = async () => {
  await ensureLatestCreateAomex(createAomexVersion);

  console.log(
    `${terminal.style('cyan', 'create-aomex')} ${terminal.style('gray', `v${createAomexVersion}`)}\n`,
  );

  const argv = yargsParser(process.argv.slice(2));
  const projectName = await inputProject(argv);
  const options = await selectOptions(argv);
  const targetDir = path.resolve(projectName);

  type PrepContext = {
    nodeVersion: string;
    packageManagerVersion: string;
    aomexVersion: string;
    aomexContribVersions?: Record<string, string>;
    prismaVersion?: string;
  };

  // 选完后立刻进入动画，网络解析版本放在「准备中」里，避免静默卡住
  const { error } = await terminal.runTasks<PrepContext>([
    {
      title: '准备中',
      task: async (ctx, api) => {
        api.suffix = '解析 Node / 依赖版本…';
        const [nodeVersion, packageManagerVersion, aomexVersion] =
          await Promise.all([
            selectNodeVersion(argv),
            resolvePackageManagerVersion(options.packageManager),
            resolveAomexVersion(),
          ]);
        ctx.nodeVersion = nodeVersion;
        ctx.packageManagerVersion = packageManagerVersion;
        ctx.aomexVersion = aomexVersion;

        if (
          options.auth.includes('oauth2') &&
          options.oauth2Presets.length > 0
        ) {
          api.suffix = '解析 @aomex-contrib 版本…';
          ctx.aomexContribVersions = await resolveAomexContribVersions(
            options.oauth2Presets,
          );
        } else if (options.oauth2Client) {
          ctx.aomexContribVersions = {};
        }

        if (options.orm === 'prisma') {
          api.suffix = '解析 Prisma 版本…';
          ctx.prismaVersion = await resolvePrismaVersion();
        }

        api.suffix = '';
      },
    },
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
      task: async (ctx) => {
        const variables: Record<string, string> = {
          projectName,
          nodeVersion: ctx.nodeVersion,
          pnpmVersion: ctx.packageManagerVersion,
          nodeMajorVersion: ctx.nodeVersion.split('.')[0]!,
        };

        const files = generateProjectFiles({
          projectName,
          options,
          packageManagerVersion: ctx.packageManagerVersion,
          aomexVersion: ctx.aomexVersion,
          aomexContribVersions: ctx.aomexContribVersions,
          prismaVersion: ctx.prismaVersion,
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
        try {
          return !/\d\.\d/.test(execSync('git -v', { encoding: 'utf8' }));
        } catch {
          return true;
        }
      },
      task: async () => {
        execSync('git init', { stdio: 'ignore' });
        await setTimeout(500);
      },
    },
  ]);

  if (error) process.exit(1);

  const pm = options.packageManager;
  const exec = packageManagerExec(pm);
  const installCmd =
    pm === 'pnpm' ? 'pnpm install' : pm === 'yarn' ? 'yarn' : 'npm install';

  console.log(`\n${terminal.style('cyan', '→')} 安装依赖\n`);
  await runShell(installCmd);
  if (pm === 'pnpm') {
    await runShell('pnpm approve-builds --all -y');
  } else if (pm === 'npm') {
    // 旧版 npm 可能无此命令；已预写 allowScripts，失败可忽略
    await runShell(
      'npm install-scripts approve --all --no-allow-scripts-pin || true',
    );
  }

  if (options.orm === 'prisma') {
    console.log(`\n${terminal.style('cyan', '→')} 生成 prisma 客户端\n`);
    await runShell(`${exec} prisma generate`);
  }

  console.log(`\n${terminal.style('cyan', '→')} 格式化代码\n`);
  await runShell(`${exec} prettier --cache --write .`);

  const startCmd =
    pm === 'npm' ? `npm start` : pm === 'yarn' ? `yarn start` : `pnpm start`;

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
