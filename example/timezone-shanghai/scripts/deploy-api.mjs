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

const env = process.argv[2];
if (!env) {
  console.error('usage: node scripts/deploy-api.mjs <production|integration>');
  process.exit(1);
}

const projectName = 'snapshot-demo';
const composeFile = `docker-compose-${env}.yml`;

sudoDocker('build', '--tag', `${projectName}:${env}`, '--file', `Dockerfile.${env}`, '.');
sudoDocker('compose', '--file', composeFile, 'up', 'api', '-d');
