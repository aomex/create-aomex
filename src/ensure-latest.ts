import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packageManagerFromUserAgent } from './select-options';
import type { PackageManager } from './types';

const REEXEC_ENV = 'CREATE_AOMEX_REEXEC';

const compareSemver = (a: string, b: string): number => {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

const fetchLatestVersion = async (): Promise<string | undefined> => {
  try {
    const res = await fetch('https://registry.npmjs.org/create-aomex', {
      signal: AbortSignal.timeout(3000),
      headers: { accept: 'application/vnd.npm.install-v1+json' },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { 'dist-tags'?: { latest?: string } };
    return data['dist-tags']?.latest;
  } catch {
    return undefined;
  }
};

const reexecCommand = (
  pm: PackageManager,
  latest: string,
  args: string[],
): { command: string; argv: string[] } => {
  // 用确切版本作缓存键，避免 @latest 命中旧 dlx 缓存
  if (pm === 'pnpm') {
    return {
      command: 'pnpm',
      argv: ['create', `aomex@${latest}`, '--', ...args],
    };
  }
  if (pm === 'yarn') {
    return {
      command: 'yarn',
      argv: ['create', `aomex@${latest}`, ...args],
    };
  }
  return {
    command: 'npm',
    argv: ['create', `aomex@${latest}`, '--', ...args],
  };
};

/** 本地 tsx / src 调试时不要切到已发布包 */
const isLocalSourceRun = (): boolean => {
  try {
    return /[/\\]src[/\\]/.test(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
};

/**
 * 若当前进程不是 registry latest，则用确切版本重新拉起脚手架（绕开 pnpm dlx @latest 缓存）。
 * 网络失败或已是最新时直接返回，不打断流程。
 */
export const ensureLatestCreateAomex = async (
  currentVersion: string,
): Promise<void> => {
  if (process.env[REEXEC_ENV] === '1') return;
  if (process.env['CREATE_AOMEX_SKIP_UPDATE'] === '1') return;
  if (isLocalSourceRun()) return;

  const latest = await fetchLatestVersion();
  if (!latest || compareSemver(latest, currentVersion) <= 0) return;

  const pm = packageManagerFromUserAgent() ?? 'npm';
  const { command, argv } = reexecCommand(pm, latest, process.argv.slice(2));

  console.log(
    `发现新版本 create-aomex@${latest}（当前 ${currentVersion}），正在切换…\n`,
  );

  const code: number = await new Promise((resolve, reject) => {
    const child = spawn(command, argv, {
      stdio: 'inherit',
      env: { ...process.env, [REEXEC_ENV]: '1' },
      shell: process.platform === 'win32',
    });
    child.on('close', (exitCode) => resolve(exitCode ?? 1));
    child.on('error', reject);
  });

  process.exit(code);
};
