import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { describe, expect, test } from 'vitest';
import {
  applyScaffoldVariablesToFiles,
  generateProjectFiles,
} from '../src/project-files';
import type { ProjectFile } from '../src/project-files';
import { databaseUrl } from '../src/generators';
import type { PrismaDatabase } from '../src/types';
import { exampleCases } from './example-cases';

const PACKAGE_MANAGER_VERSION = '12.21.0';
/** 示例固定 aomex 版本（真实脚手架运行时 resolveAomexVersion → latest） */
const AOMEX_VERSION = '4.1.0';
/** 示例固定 prisma 7.x（真实脚手架运行时 resolvePrismaVersion） */
const PRISMA_VERSION = '7.10.1';
const PROJECT_NAME = 'snapshot-demo';
/** 示例固定值，与真实脚手架写入磁盘后的内容对齐 */
const NODE_VERSION = '24.22.0';
/** 示例固定 cron 端口（真实脚手架：1024–65535 随机） */
const CRON_PORT = 23456;
/** 示例固定文档路径后缀（真实脚手架用 crypto.randomBytes） */
const DOCS_PATH_SECRET = '7c3e9a1f02b48d6e';
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(TEST_DIR, '..');
const EXAMPLES_ROOT = path.join(REPO_ROOT, 'example');
const ROOT_BIN = path.join(REPO_ROOT, 'node_modules', '.bin');
const PRETTIER_BIN = path.join(ROOT_BIN, 'prettier');

const normalizeNewlines = (s: string) => s.replace(/\r\n/g, '\n');

const isGeneratedPath = (p: string) => p.startsWith('src/generated/');

const listFilesRecursive = (dir: string, prefix = ''): string[] => {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${name.name}` : name.name;
    if (name.isDirectory()) {
      out.push(...listFilesRecursive(path.join(dir, name.name), rel));
    } else {
      out.push(rel);
    }
  }
  return out;
};

const shouldUpdateSnapshots = (): boolean => {
  if (process.env['DIR_SNAPSHOT_UPDATE'] === '1') return true;
  if (
    process.argv.some(
      (a) => a === '-u' || a === '--update' || a === '--update-snapshots',
    )
  ) {
    return true;
  }
  const snapshotState = expect.getState().snapshotState as
    { updateSnapshot?: string } | undefined;
  const flag = snapshotState?.updateSnapshot;
  return flag === 'all' || flag === 'new';
};

/**
 * 在仓库根目录执行 `pnpm exec prisma generate --schema <case>/prisma/schema.prisma`，
 * 复用根依赖（避免在 example 里装 node_modules），并校验生成产物。
 */
const runPrismaGenerateInCase = (caseDir: string, db: PrismaDatabase): void => {
  const schema = path.join(caseDir, 'prisma', 'schema.prisma');
  if (!existsSync(schema)) {
    throw new Error(`missing prisma schema: ${schema}`);
  }

  let output = '';
  try {
    output = execFileSync(
      'pnpm',
      ['exec', 'prisma', 'generate', '--schema', schema],
      {
        cwd: REPO_ROOT,
        env: {
          ...process.env,
          PATH: `${ROOT_BIN}${path.delimiter}${process.env['PATH'] ?? ''}`,
          DATABASE_URL: databaseUrl(db, PROJECT_NAME),
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch (err) {
    const detail =
      err && typeof err === 'object' && 'stderr' in err
        ? String((err as { stderr?: Buffer | string }).stderr ?? '')
        : '';
    const stdout =
      err && typeof err === 'object' && 'stdout' in err
        ? String((err as { stdout?: Buffer | string }).stdout ?? '')
        : '';
    throw new Error(
      `pnpm exec prisma generate failed for ${caseDir}\n${stdout}${detail}`,
    );
  }

  if (/command not found|Generator ".*" failed/i.test(output)) {
    throw new Error(
      `pnpm exec prisma generate reported generator failure for ${caseDir}\n${output}`,
    );
  }

  const clientOut = path.join(caseDir, 'src/generated/prisma');
  const aomexOut = path.join(caseDir, 'src/generated/aomex/prisma');
  if (!existsSync(clientOut) || !existsSync(aomexOut)) {
    throw new Error(
      `prisma generate did not write expected outputs under ${caseDir}/src/generated`,
    );
  }
};

/** 用 case 目录内的 .prettierrc.yml / .prettierignore 格式化 */
const runPrettierInCase = (caseDir: string): void => {
  execFileSync(PRETTIER_BIN, ['--write', '.'], {
    cwd: caseDir,
    env: {
      ...process.env,
      PATH: `${path.join(REPO_ROOT, 'node_modules', '.bin')}${path.delimiter}${process.env['PATH'] ?? ''}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

/** 与 `prettier --write` 对齐，供比对时期望内容也走同一套规则 */
const formatContentLikePrettierWrite = async (
  caseDir: string,
  rel: string,
  content: string,
): Promise<string> => {
  const filePath = path.join(caseDir, rel);
  const info = await prettier.getFileInfo(filePath, {
    ignorePath: path.join(caseDir, '.prettierignore'),
  });
  if (info.ignored || info.inferredParser == null) {
    return normalizeNewlines(content);
  }
  const config = await prettier.resolveConfig(filePath);
  return normalizeNewlines(
    await prettier.format(content, {
      ...config,
      filepath: filePath,
    }),
  );
};

/**
 * 每个示例一个目录，镜像生成项目的相对路径：
 * example/<case>/src/web.ts
 *
 * `src/generated/**` 由 prisma generate 产出，更新时写入磁盘供 IDE，
 * 但不纳入文件列表 / 内容比对（避免把生成物当脚手架源）。
 */
const expectExampleDirectory = async (
  caseName: string,
  files: Record<string, ProjectFile>,
  prismaDatabase?: PrismaDatabase | null,
) => {
  const caseDir = path.join(EXAMPLES_ROOT, caseName);
  const expectedPaths = Object.keys(files).sort((a, b) => a.localeCompare(b));

  if (shouldUpdateSnapshots()) {
    rmSync(caseDir, { recursive: true, force: true });
    mkdirSync(caseDir, { recursive: true });
    for (const rel of expectedPaths) {
      const abs = path.join(caseDir, rel);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, normalizeNewlines(files[rel]!.content), 'utf8');
      const mode = files[rel]!.mode;
      if (mode !== undefined) chmodSync(abs, mode);
    }
    if (prismaDatabase) {
      runPrismaGenerateInCase(caseDir, prismaDatabase);
    }
    runPrettierInCase(caseDir);
    return;
  }

  const onDisk = listFilesRecursive(caseDir)
    .filter((p) => !isGeneratedPath(p))
    .sort((a, b) => a.localeCompare(b));

  expect(onDisk, `${caseName} file list`).toEqual(expectedPaths);

  for (const rel of expectedPaths) {
    const abs = path.join(caseDir, rel);
    const actual = normalizeNewlines(readFileSync(abs, 'utf8'));
    const expected = await formatContentLikePrettierWrite(
      caseDir,
      rel,
      files[rel]!.content,
    );
    expect(actual, `${caseName}/${rel}`).toBe(expected);
    const expectedMode = files[rel]!.mode;
    if (expectedMode !== undefined && process.platform !== 'win32') {
      const mode = statSync(abs).mode & 0o777;
      expect(mode, `${caseName}/${rel} mode`).toBe(expectedMode);
    }
  }
};

describe('generateProjectFiles examples', () => {
  for (const { name, options } of exampleCases) {
    test(name, async () => {
      const files = applyScaffoldVariablesToFiles(
        generateProjectFiles({
          projectName: PROJECT_NAME,
          options,
          packageManagerVersion: PACKAGE_MANAGER_VERSION,
          aomexVersion: AOMEX_VERSION,
          prismaVersion: PRISMA_VERSION,
          docsPathSecret: DOCS_PATH_SECRET,
          cronPort: CRON_PORT,
        }),
        {
          projectName: PROJECT_NAME,
          nodeVersion: NODE_VERSION,
          pnpmVersion: PACKAGE_MANAGER_VERSION,
          nodeMajorVersion: NODE_VERSION.split('.')[0]!,
        },
      );

      await expectExampleDirectory(
        name,
        files,
        options.orm === 'prisma' ? options.prismaDatabase : null,
      );
    });
  }
});
