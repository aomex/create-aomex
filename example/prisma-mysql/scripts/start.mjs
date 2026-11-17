import 'dotenv/config';
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

execSync('docker compose -f docker-compose.yml up --wait', { stdio: 'inherit' });
const healthCheck = execSync('docker compose -f docker-compose.yml ps', { encoding: 'utf8' });
if (healthCheck.includes('unhealthy')) process.exit(1);

execSync('pnpm exec prisma generate', { stdio: 'inherit' });
if (existsSync('prisma/migrations')) {
  execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });
} else if (existsSync('prisma/schema.prisma')) {
  execSync('pnpm exec prisma db push', { stdio: 'inherit' });
}

const api = spawn('node', ['--import', 'tsx/esm', '--watch', 'src/web.ts'], {
  stdio: 'inherit',
  env: process.env,
});
const cron = spawn('pnpm', ['exec', 'aomex', 'cron:start'], { stdio: 'inherit', env: process.env });

process.on('SIGINT', () => {
  cron.kill('SIGINT');
  api.kill('SIGINT');
  execSync('docker compose -f docker-compose.yml down', { stdio: 'inherit' });
});
