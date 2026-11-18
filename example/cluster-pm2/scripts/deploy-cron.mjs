import { execFileSync } from 'node:child_process';
import process from 'node:process';

const run = (file, args) => {
  console.log('+', file, ...args);
  execFileSync(file, args, { stdio: 'inherit' });
};

const sudoDocker = (...args) => run('sudo', ['docker', ...args]);

/** aomex cron:stop / cron:stats 常以 exit 130（SIGINT）结束 */
const ignoreExit = (fn, codes = [130]) => {
  try {
    fn();
  } catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? err.status : undefined;
    if (!codes.includes(status)) throw err;
  }
};

const isCronRunning = (composeFile) => {
  try {
    const out = execFileSync(
      'sudo',
      ['docker', 'compose', '--file', composeFile, 'ps', '--status', 'running', '--services'],
      { encoding: 'utf8' },
    );
    return out
      .split('\n')
      .map((s) => s.trim())
      .includes('cron');
  } catch {
    return false;
  }
};

/** exit 130 SIGINT；再 compose stop，避免 unless-stopped 因主进程退出而把容器拉起 */
const gracefulCronStop = (composeFile) => {
  if (!isCronRunning(composeFile)) return;
  ignoreExit(() =>
    sudoDocker(
      'compose',
      '--file',
      composeFile,
      'exec',
      '-T',
      'cron',
      '/bin/sh',
      '-c',
      'aomex cron:stop',
    ),
  );
  sudoDocker('compose', '--file', composeFile, 'stop', 'cron', '--timeout', '1');
};

const env = process.argv[2];
if (!env) {
  console.error('usage: node scripts/deploy-cron.mjs <production|integration>');
  process.exit(1);
}

const projectName = 'snapshot-demo';
const composeFile = `docker-compose-${env}.yml`;

sudoDocker('build', '--tag', `${projectName}:${env}`, '--file', `Dockerfile.${env}`, '.');
gracefulCronStop(composeFile);
sudoDocker('compose', '--file', composeFile, 'up', 'cron', '-d');
