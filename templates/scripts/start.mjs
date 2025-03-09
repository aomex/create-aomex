import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

execSync('docker compose -f docker-compose.yml down', { stdio: 'inherit' });
execSync('docker compose -f docker-compose.yml up --wait', { stdio: 'inherit' });
const ps = execSync('docker compose -f docker-compose.yml ps', { stdio: 'pipe', encoding: 'utf8' });
if (ps.includes('unhealthy')) process.exit(1);

execSync('npx prisma generate', { stdio: 'inherit' });
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
const api = spawn('node', ['--import', 'tsx/esm', '--watch', 'src/web.ts'], { stdio: 'inherit' });
const cron = spawn('npx', ['aomex', 'cron:start'], { stdio: 'inherit' });

process.on('SIGINT', () => {
  cron.kill('SIGINT');
  api.kill('SIGINT');
  execSync('docker compose -f docker-compose.yml down', { stdio: 'inherit' });
});
