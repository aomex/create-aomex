import 'dotenv/config';
import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

execSync('docker compose -f docker-compose.yml up --wait', { stdio: 'inherit' });
const healthCheck = execSync('docker compose -f docker-compose.yml ps', { encoding: 'utf8' });
if (healthCheck.includes('unhealthy')) process.exit(1);

const api = spawn('node', ['--import', 'tsx/esm', '--watch', 'src/web.ts'], {
  stdio: 'inherit',
  env: process.env,
});
const cron = spawn('yarn', ['aomex', 'cron:start'], { stdio: 'inherit', env: process.env });

process.on('SIGINT', () => {
  cron.kill('SIGINT');
  api.kill('SIGINT');
  execSync('docker compose -f docker-compose.yml down', { stdio: 'inherit' });
});
